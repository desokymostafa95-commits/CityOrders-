using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CityOrders.Api.API.Controllers
{
    [Route("api/merchant/subscription")]
    [ApiController]
    [Authorize]
    [Tags("Merchant - Subscription")]
    public class MerchantSubscriptionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;
        private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
        private const long MaxFileSize = 5 * 1024 * 1024; // 5MB

        public MerchantSubscriptionController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        private int GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null ? int.Parse(claim.Value) : 0;
        }

        /// <summary>
        /// List all enabled subscription plans
        /// </summary>
        [HttpGet("plans")]
        public async Task<IActionResult> GetPlans()
        {
            var plans = await _context.SubscriptionPlans
                .Where(sp => sp.IsEnabled)
                .AsNoTracking()
                .Select(sp => new SubscriptionPlanPublicDto
                {
                    Id = sp.Id,
                    Name = sp.Name,
                    PriceEgp = sp.PriceEgp,
                    DurationDays = sp.DurationDays,
                    GraceDays = sp.GraceDays,
                    MaxConcurrentOffers = sp.MaxConcurrentOffers
                })
                .ToListAsync();

            return Ok(plans);
        }

        /// <summary>
        /// Get current subscription status
        /// </summary>
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            var userId = GetUserId();

            var subscription = await _context.MerchantSubscriptions
                .Include(ms => ms.Plan)
                .OrderByDescending(ms => ms.EndDate)
                .AsNoTracking()
                .FirstOrDefaultAsync(ms => ms.UserId == userId);

            var hasPendingPayment = await _context.SubscriptionPaymentRequests
                .AnyAsync(spr => spr.UserId == userId && spr.Status == "Pending");

            var settings = await _context.AppSettings.FirstOrDefaultAsync();
            var isFreeTrialEnabled = settings?.IsFreeTrialEnabled ?? true;
            var freeTrialDays = settings?.FreeTrialDays ?? 14;

            var profile = await _context.MerchantProfiles.AsNoTracking().FirstOrDefaultAsync(mp => mp.UserId == userId);

            if (subscription == null)
            {
                return Ok(new MerchantSubscriptionStatusDto
                {
                    HasSubscription = false,
                    State = "None",
                    HasPendingPayment = hasPendingPayment,
                    TrialAvailable = true,
                    TrialActivated = false,
                    IsFreeTrialEnabled = isFreeTrialEnabled,
                    FreeTrialDays = freeTrialDays,
                    IsActive = profile?.IsActive ?? true,
                    IsApproved = profile?.IsApproved ?? false,
                    UpdatedAt = profile?.UpdatedAt,
                    RejectionReason = profile?.RejectionReason,
                    GraceDays = settings?.TrialGraceDays ?? 3,
                    MaxConcurrentOffers = settings?.TrialMaxConcurrentOffers ?? 1
                });
            }

            return Ok(new MerchantSubscriptionStatusDto
            {
                HasSubscription = true,
                State = subscription.GetState(),
                PlanName = subscription.Plan?.Name ?? "Free Trial",
                StartDate = subscription.StartDate,
                EndDate = subscription.EndDate,
                GraceEndDate = subscription.GraceEndDate,
                DaysRemaining = subscription.GetDaysRemaining(),
                HasPendingPayment = hasPendingPayment,
                IsTrial = subscription.IsTrial,
                TrialAvailable = false,
                TrialActivated = subscription.IsTrial,
                IsFreeTrialEnabled = isFreeTrialEnabled,
                FreeTrialDays = freeTrialDays,
                IsActive = profile?.IsActive ?? true,
                IsApproved = profile?.IsApproved ?? false,
                UpdatedAt = profile?.UpdatedAt,
                RejectionReason = profile?.RejectionReason,
                GraceDays = subscription.IsTrial ? (settings?.TrialGraceDays ?? 3) : (subscription.Plan?.GraceDays ?? 0),
                MaxConcurrentOffers = subscription.IsTrial ? (settings?.TrialMaxConcurrentOffers ?? 1) : (subscription.Plan?.MaxConcurrentOffers ?? 0)
            });
        }

        /// <summary>
        /// Activate manual free trial
        /// </summary>
        [HttpPost("trial/activate")]
        public async Task<IActionResult> ActivateTrial()
        {
            var userId = GetUserId();

            var settings = await _context.AppSettings.FirstOrDefaultAsync();
            var isFreeTrialEnabled = settings?.IsFreeTrialEnabled ?? true;
            var freeTrialDays = settings?.FreeTrialDays ?? 14;
            var trialGraceDays = settings?.TrialGraceDays ?? 3;

            if (!isFreeTrialEnabled)
                return StatusCode(403, "Free trial is currently disabled. Please renew using payment proof.");

            // Check if already has any subscription
            var existing = await _context.MerchantSubscriptions
                .AnyAsync(ms => ms.UserId == userId);

            if (existing)
                return Conflict("Trial already activated or you have an existing subscription.");

            if (freeTrialDays <= 0)
                 return StatusCode(403, "Free trial duration is zero.");


            var now = DateTime.UtcNow;
            var trialSubscription = new MerchantSubscription
            {
                UserId = userId,
                PlanId = null,
                IsTrial = true,
                StartDate = now,
                EndDate = now.AddDays(freeTrialDays),
                GraceEndDate = now.AddDays(freeTrialDays + trialGraceDays)
            };

            _context.MerchantSubscriptions.Add(trialSubscription);
            await _context.SaveChangesAsync();

            return Ok(new MerchantSubscriptionStatusDto
            {
                HasSubscription = true,
                State = "Active",
                PlanName = "Free Trial",
                StartDate = trialSubscription.StartDate,
                EndDate = trialSubscription.EndDate,
                GraceEndDate = trialSubscription.GraceEndDate,
                DaysRemaining = freeTrialDays,
                IsTrial = true,
                TrialAvailable = false,
                TrialActivated = true,
                IsFreeTrialEnabled = isFreeTrialEnabled,
                FreeTrialDays = freeTrialDays,
                MaxConcurrentOffers = settings?.TrialMaxConcurrentOffers ?? 1,
                GraceDays = trialGraceDays
            });
        }

        /// <summary>
        /// Submit payment proof for subscription
        /// </summary>
        [HttpPost("payment-request")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> SubmitPaymentRequest([FromForm] SubmitPaymentRequestDto dto)
        {
            var userId = GetUserId();

            // Check for existing pending request
            var hasPending = await _context.SubscriptionPaymentRequests
                .AnyAsync(spr => spr.UserId == userId && spr.Status == "Pending");

            if (hasPending)
                return Conflict("You already have a pending payment request. Please wait for admin review.");

            // Validate plan
            var plan = await _context.SubscriptionPlans
                .FirstOrDefaultAsync(sp => sp.Id == dto.PlanId && sp.IsEnabled);

            if (plan == null)
                return BadRequest("Plan not found or is disabled.");

            // Validate file
            if (dto.ProofFile == null || dto.ProofFile.Length == 0)
                return BadRequest("Proof file is required.");

            if (dto.ProofFile.Length > MaxFileSize)
                return BadRequest("File size must not exceed 5MB.");

            var extension = Path.GetExtension(dto.ProofFile.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
                return BadRequest("Only jpg, png, and webp files are allowed.");

            // Save file
            var uploadsDir = Path.Combine(_env.WebRootPath ?? _env.ContentRootPath, "uploads", "payment-proofs");
            Directory.CreateDirectory(uploadsDir);

            var fileName = $"{userId}_{DateTime.UtcNow:yyyyMMddHHmmss}{extension}";
            var filePath = Path.Combine(uploadsDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await dto.ProofFile.CopyToAsync(stream);
            }

            // Create payment request
            var request = new SubscriptionPaymentRequest
            {
                UserId = userId,
                PlanId = dto.PlanId,
                ProofFilePath = $"/uploads/payment-proofs/{fileName}",
                PayerNumber = dto.PayerNumber.Trim(),
                Status = "Pending"
            };

            _context.SubscriptionPaymentRequests.Add(request);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPaymentHistory), new { id = request.Id }, 
                new { id = request.Id, message = "Payment proof submitted. Awaiting admin review." });
        }

        /// <summary>
        /// Get payment request history
        /// </summary>
        [HttpGet("payment-requests")]
        public async Task<IActionResult> GetPaymentHistory()
        {
            var userId = GetUserId();

            var requests = await _context.SubscriptionPaymentRequests
                .Include(spr => spr.Plan)
                .Where(spr => spr.UserId == userId)
                .OrderByDescending(spr => spr.CreatedAt)
                .AsNoTracking()
                .Select(spr => new PaymentRequestHistoryDto
                {
                    Id = spr.Id,
                    PlanName = spr.Plan.Name,
                    PlanPriceEgp = spr.Plan.PriceEgp,
                    Status = spr.Status,
                    AdminNotes = spr.AdminNotes,
                    CreatedAt = spr.CreatedAt,
                    ReviewedAt = spr.ReviewedAt
                })
                .ToListAsync();

            return Ok(requests);
        }
    }
}
