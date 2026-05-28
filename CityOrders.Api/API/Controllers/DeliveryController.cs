using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Application.Services;
using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace CityOrders.Api.API.Controllers
{
    [Route("api/delivery")]
    [ApiController]
    [Authorize(Roles = "Delivery")]
    public class DeliveryController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly NotificationService _notificationService;

        public DeliveryController(AppDbContext context, NotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        [HttpGet("me")]
        public async Task<ActionResult<DeliveryAgentDto>> GetMe()
        {
            var profile = await GetProfileQuery().FirstOrDefaultAsync(p => p.UserId == GetUserId());
            if (profile == null) return NotFound("Delivery profile not found.");
            return Ok(ToAgentDto(profile));
        }

        [HttpPost("availability")]
        public async Task<ActionResult> UpdateAvailability([FromQuery] bool available)
        {
            var profile = await _context.DeliveryProfiles.FirstOrDefaultAsync(p => p.UserId == GetUserId());
            if (profile == null) return NotFound("Delivery profile not found.");
            if (!profile.IsActive) return BadRequest("Delivery account is inactive.");

            profile.IsAvailable = available;
            profile.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { profile.IsAvailable });
        }

        [HttpPost("location")]
        public async Task<ActionResult> UpdateLocation([FromBody] UpdateDeliveryLocationDto dto)
        {
            var profile = await _context.DeliveryProfiles.FirstOrDefaultAsync(p => p.UserId == GetUserId());
            if (profile == null) return NotFound("Delivery profile not found.");

            profile.LastLat = dto.Lat;
            profile.LastLng = dto.Lng;
            profile.LastLocationAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpGet("available-orders")]
        public async Task<ActionResult<IEnumerable<DeliveryAssignmentDto>>> GetAvailableOrders()
        {
            var profile = await _context.DeliveryProfiles
                .Include(p => p.DeliveryOffice)
                .FirstOrDefaultAsync(p => p.UserId == GetUserId());

            if (profile == null) return NotFound("Delivery profile not found.");
            if (!profile.IsActive || !profile.IsAvailable) return Ok(Array.Empty<DeliveryAssignmentDto>());

            var query = _context.DeliveryAssignments
                .Include(a => a.Order).ThenInclude(o => o.Brand)
                .Include(a => a.Order).ThenInclude(o => o.Customer)
                .Include(a => a.DeliveryOffice)
                .Where(a => a.Status == DeliveryAssignmentStatus.Offered &&
                            a.Order.Status == OrderStatus.OutForDelivery);

            if (profile.AgentType == DeliveryAgentType.MerchantOwned)
            {
                query = query.Where(a =>
                    a.Source == DeliveryAssignmentSource.MerchantPrivate &&
                    a.Order.Brand.MerchantUserId == profile.MerchantUserId);
            }
            else
            {
                query = query.Where(a => a.Source == DeliveryAssignmentSource.PlatformPool);
            }

            var assignments = await query
                .OrderBy(a => a.CreatedAt)
                .Take(30)
                .AsNoTracking()
                .ToListAsync();

            return Ok(assignments.Select(ToAssignmentDto));
        }

        [HttpPost("orders/{orderId}/accept")]
        public async Task<ActionResult<DeliveryAssignmentDto>> AcceptOrder(int orderId)
        {
            var userId = GetUserId();
            var profile = await _context.DeliveryProfiles
                .Include(p => p.DeliveryOffice)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null) return NotFound("Delivery profile not found.");
            if (!profile.IsActive || !profile.IsAvailable) return BadRequest("Delivery agent is not available.");

            var assignment = await _context.DeliveryAssignments
                .Include(a => a.Order).ThenInclude(o => o.Brand)
                .Include(a => a.Order).ThenInclude(o => o.Customer)
                .Include(a => a.DeliveryOffice)
                .FirstOrDefaultAsync(a => a.OrderId == orderId && a.Status == DeliveryAssignmentStatus.Offered);

            if (assignment == null) return NotFound("Available delivery assignment not found.");

            if (!CanAgentAccept(profile, assignment))
                return Forbid();

            assignment.Status = DeliveryAssignmentStatus.Accepted;
            assignment.AgentUserId = userId;
            assignment.DeliveryOfficeId = profile.DeliveryOfficeId;
            assignment.AcceptedAt = DateTime.UtcNow;
            var platformSettings = profile.AgentType == DeliveryAgentType.Independent
                ? await EnsurePlatformSettingsAsync()
                : null;
            ApplyEarningsSnapshot(profile, assignment, platformSettings);

            assignment.Order.DeliveryUserId = userId;
            assignment.Order.UpdatedAt = DateTime.UtcNow;
            profile.IsAvailable = false;
            profile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await _notificationService.CreateAsync(
                assignment.Order.CustomerUserId,
                "مندوب التوصيل قبل الطلب",
                $"مندوب التوصيل قبل طلبك رقم {assignment.Order.OrderNumber}.",
                "DeliveryAccepted",
                assignment.OrderId);

            return Ok(ToAssignmentDto(assignment));
        }

        [HttpPost("orders/{orderId}/status")]
        public async Task<ActionResult<DeliveryAssignmentDto>> UpdateOrderStatus(int orderId, [FromBody] DeliveryOrderActionDto dto)
        {
            var userId = GetUserId();
            var assignment = await _context.DeliveryAssignments
                .Include(a => a.Order).ThenInclude(o => o.Brand)
                .Include(a => a.Order).ThenInclude(o => o.Customer)
                .Include(a => a.AgentUser)
                .Include(a => a.DeliveryOffice)
                .FirstOrDefaultAsync(a => a.OrderId == orderId && a.AgentUserId == userId);

            if (assignment == null) return NotFound("Delivery assignment not found.");

            var profile = await _context.DeliveryProfiles
                .Include(p => p.DeliveryOffice)
                .FirstOrDefaultAsync(p => p.UserId == userId);
            if (profile == null) return NotFound("Delivery profile not found.");

            var action = dto.Action.Trim().ToLowerInvariant();
            if (action == "picked-up")
            {
                if (assignment.Status != DeliveryAssignmentStatus.Accepted)
                    return BadRequest("Order must be accepted before pickup.");

                assignment.Status = DeliveryAssignmentStatus.PickedUp;
                assignment.PickedUpAt = DateTime.UtcNow;
            }
            else if (action == "delivered")
            {
                if (assignment.Status != DeliveryAssignmentStatus.Accepted &&
                    assignment.Status != DeliveryAssignmentStatus.PickedUp)
                    return BadRequest("Order must be accepted before delivery.");

                assignment.Status = DeliveryAssignmentStatus.Delivered;
                assignment.DeliveredAt = DateTime.UtcNow;
                assignment.Order.Status = OrderStatus.Delivered;
                assignment.Order.DeliveredAt = DateTime.UtcNow;
                var platformSettings = profile.AgentType == DeliveryAgentType.Independent
                    ? await EnsurePlatformSettingsAsync()
                    : null;
                ApplyCollectionSchedule(profile, assignment, platformSettings);
                profile.IsAvailable = true;
                profile.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                return BadRequest("Invalid delivery action.");
            }

            assignment.Order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _notificationService.CreateAsync(
                assignment.Order.CustomerUserId,
                "تحديث التوصيل",
                $"تم تحديث حالة توصيل طلبك رقم {assignment.Order.OrderNumber}.",
                "DeliveryStatus",
                assignment.OrderId);

            return Ok(ToAssignmentDto(assignment));
        }

        private bool CanAgentAccept(DeliveryProfile profile, DeliveryAssignment assignment)
        {
            if (profile.AgentType == DeliveryAgentType.MerchantOwned)
            {
                return assignment.Source == DeliveryAssignmentSource.MerchantPrivate &&
                       assignment.Order.Brand.MerchantUserId == profile.MerchantUserId;
            }

            return assignment.Source == DeliveryAssignmentSource.PlatformPool;
        }

        private static void ApplyEarningsSnapshot(DeliveryProfile profile, DeliveryAssignment assignment, DeliveryPlatformSettings? platformSettings)
        {
            var fee = assignment.DeliveryFeeSnapshot;
            if (profile.AgentType == DeliveryAgentType.Office)
            {
                var percent = profile.CommissionPercent ?? profile.DeliveryOffice?.DefaultCommissionPercent ?? 0;
                var officeAmount = Math.Round(fee * percent / 100m, 2);
                assignment.OfficeCommissionPercent = percent;
                assignment.OfficeCommissionAmount = officeAmount;
                assignment.AgentEarningAmount = fee - officeAmount;
                return;
            }

            if (profile.AgentType == DeliveryAgentType.Independent)
            {
                var percent = platformSettings?.IndependentPlatformCommissionPercent ?? 0;
                var platformAmount = Math.Round(fee * percent / 100m, 2);
                assignment.PlatformCommissionPercent = percent;
                assignment.PlatformCommissionAmount = platformAmount;
                assignment.AgentEarningAmount = fee - platformAmount;
                return;
            }

            assignment.AgentEarningAmount = fee;
        }

        private static void ApplyCollectionSchedule(DeliveryProfile profile, DeliveryAssignment assignment, DeliveryPlatformSettings? platformSettings)
        {
            if (profile.AgentType == DeliveryAgentType.Office && profile.DeliveryOffice != null)
            {
                ApplyCollectionSchedule(
                    assignment,
                    DeliveryCollectionRecipient.DeliveryOffice,
                    assignment.OfficeCommissionAmount,
                    profile.DeliveryOffice.AgentCollectionCycleDays,
                    profile.DeliveryOffice.AgentCollectionMethodsJson);
                return;
            }

            if (profile.AgentType == DeliveryAgentType.Independent && platformSettings != null)
            {
                ApplyCollectionSchedule(
                    assignment,
                    DeliveryCollectionRecipient.Platform,
                    assignment.PlatformCommissionAmount,
                    platformSettings.IndependentCollectionCycleDays,
                    platformSettings.IndependentCollectionMethodsJson);
            }
        }

        private static void ApplyCollectionSchedule(DeliveryAssignment assignment, DeliveryCollectionRecipient recipient, decimal? amount, int cycleDays, string methodsJson)
        {
            if (!amount.HasValue || amount.Value <= 0)
            {
                assignment.CollectionStatus = DeliveryCollectionStatus.NotRequired;
                assignment.CollectionRecipient = null;
                assignment.CollectionAmount = null;
                assignment.CollectionDueAt = null;
                return;
            }

            var deliveredAt = assignment.DeliveredAt ?? DateTime.UtcNow;
            var methods = ParseMethods(methodsJson);
            assignment.CollectionRecipient = recipient;
            assignment.CollectionStatus = DeliveryCollectionStatus.Pending;
            assignment.CollectionAmount = amount.Value;
            assignment.CollectionCycleDays = Math.Max(cycleDays, 1);
            assignment.CollectionDueAt = deliveredAt.AddDays(Math.Max(cycleDays, 1));
            assignment.CollectionMethodsSnapshot = SerializeMethods(methods);
            assignment.CollectionMethod = methods.FirstOrDefault();
        }

        private async Task<DeliveryPlatformSettings> EnsurePlatformSettingsAsync()
        {
            var settings = await _context.DeliveryPlatformSettings.FirstOrDefaultAsync();
            if (settings != null) return settings;

            settings = new DeliveryPlatformSettings
            {
                IndependentPlatformCommissionPercent = 0,
                IndependentCollectionCycleDays = 7,
                IndependentCollectionMethodsJson = "[\"Cash\",\"Instapay\",\"COD\"]"
            };
            _context.DeliveryPlatformSettings.Add(settings);
            await _context.SaveChangesAsync();
            return settings;
        }

        [HttpGet("plans")]
        public async Task<IActionResult> GetPlans()
        {
            var plans = await _context.DeliveryPlans
                .Where(dp => dp.IsEnabled)
                .AsNoTracking()
                .Select(dp => new DeliveryPlanDto
                {
                    Id = dp.Id,
                    Name = dp.Name,
                    PriceEgp = dp.PriceEgp,
                    DurationDays = dp.DurationDays,
                    IsEnabled = dp.IsEnabled,
                    Description = dp.Description,
                    CreatedAt = dp.CreatedAt
                })
                .ToListAsync();

            return Ok(plans);
        }

        [HttpGet("owed-balance")]
        public async Task<IActionResult> GetOwedBalance()
        {
            var userId = GetUserId();
            var totalOwed = await _context.DeliveryAssignments
                .Where(a => a.AgentUserId == userId && a.CollectionStatus == DeliveryCollectionStatus.Pending)
                .SumAsync(a => a.CollectionAmount) ?? 0m;

            return Ok(new { owedAmount = totalOwed });
        }

        [HttpPost("payment-requests")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> SubmitPaymentRequest([FromForm] SubmitDeliveryPaymentRequestDto dto, [FromServices] Microsoft.AspNetCore.Hosting.IWebHostEnvironment env)
        {
            var userId = GetUserId();

            // Check for existing pending request
            var hasPending = await _context.DeliveryPaymentRequests
                .AnyAsync(r => r.AgentUserId == userId && r.Status == "Pending");

            if (hasPending)
                return Conflict("You already have a pending payment request. Please wait for admin review.");

            // Validate plan
            var plan = await _context.DeliveryPlans
                .FirstOrDefaultAsync(dp => dp.Id == dto.PlanId && dp.IsEnabled);

            if (plan == null)
                return BadRequest("Selected delivery plan not found or is disabled.");

            // Validate amount
            if (dto.Amount <= 0)
                return BadRequest("Amount must be greater than 0.");

            // Validate file
            if (dto.ProofFile == null || dto.ProofFile.Length == 0)
                return BadRequest("Proof file is required.");

            if (dto.ProofFile.Length > 5 * 1024 * 1024) // 5MB limit
                return BadRequest("File size must not exceed 5MB.");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(dto.ProofFile.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
                return BadRequest("Only jpg, png, and webp files are allowed.");

            // Save file
            var uploadsDir = Path.Combine(env.WebRootPath ?? env.ContentRootPath, "uploads", "delivery-payment-proofs");
            Directory.CreateDirectory(uploadsDir);

            var fileName = $"{userId}_{DateTime.UtcNow:yyyyMMddHHmmss}{extension}";
            var filePath = Path.Combine(uploadsDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await dto.ProofFile.CopyToAsync(stream);
            }

            // Create payment request
            var request = new DeliveryPaymentRequest
            {
                AgentUserId = userId,
                PlanId = dto.PlanId,
                Amount = dto.Amount,
                ProofFilePath = $"/uploads/delivery-payment-proofs/{fileName}",
                PayerNumber = dto.PayerNumber.Trim(),
                Status = "Pending"
            };

            _context.DeliveryPaymentRequests.Add(request);
            await _context.SaveChangesAsync();

            return Ok(new { id = request.Id, message = "Payment request submitted successfully. Awaiting admin review." });
        }

        [HttpGet("payment-requests")]
        public async Task<IActionResult> GetPaymentRequests()
        {
            var userId = GetUserId();
            var requests = await _context.DeliveryPaymentRequests
                .Include(r => r.Plan)
                .Include(r => r.AgentUser)
                .Where(r => r.AgentUserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new DeliveryPaymentRequestListDto
                {
                    Id = r.Id,
                    AgentUserId = r.AgentUserId,
                    AgentName = r.AgentUser.Name,
                    AgentEmail = r.AgentUser.Email,
                    PlanName = r.Plan.Name,
                    PlanPriceEgp = r.Plan.PriceEgp,
                    Amount = r.Amount,
                    ProofFileUrl = r.ProofFilePath,
                    PayerNumber = r.PayerNumber,
                    Status = r.Status,
                    AdminNotes = r.AdminNotes,
                    CreatedAt = r.CreatedAt,
                    ReviewedAt = r.ReviewedAt
                })
                .ToListAsync();

            return Ok(requests);
        }

        private IQueryable<DeliveryProfile> GetProfileQuery() =>
            _context.DeliveryProfiles
                .Include(p => p.User)
                .Include(p => p.DeliveryOffice)
                .Include(p => p.MerchantUser)
                .AsNoTracking();

        private int GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            return idClaim == null ? 0 : int.Parse(idClaim.Value);
        }

        private static DeliveryAgentDto ToAgentDto(DeliveryProfile profile) => new()
        {
            UserId = profile.UserId,
            Name = profile.User?.Name ?? string.Empty,
            Email = profile.User?.Email ?? string.Empty,
            AgentType = profile.AgentType.ToString(),
            DeliveryOfficeId = profile.DeliveryOfficeId,
            DeliveryOfficeName = profile.DeliveryOffice?.Name,
            MerchantUserId = profile.MerchantUserId,
            MerchantName = profile.MerchantUser?.Name,
            Phone = profile.Phone,
            VehicleType = profile.VehicleType,
            IsActive = profile.IsActive,
            IsAvailable = profile.IsAvailable,
            CommissionPercent = profile.CommissionPercent,
            CreatedAt = profile.CreatedAt
        };

        private static DeliveryAssignmentDto ToAssignmentDto(DeliveryAssignment assignment) => new()
        {
            Id = assignment.Id,
            OrderId = assignment.OrderId,
            OrderNumber = assignment.Order.OrderNumber,
            Source = assignment.Source.ToString(),
            Status = assignment.Status.ToString(),
            BrandName = assignment.Order.Brand.Name,
            CustomerName = assignment.Order.Customer.Name,
            AgentName = assignment.AgentUser?.Name,
            DeliveryOfficeName = assignment.DeliveryOffice?.Name,
            DeliveryFeeSnapshot = assignment.DeliveryFeeSnapshot,
            PlatformCommissionAmount = assignment.PlatformCommissionAmount,
            AgentEarningAmount = assignment.AgentEarningAmount,
            OfficeCommissionAmount = assignment.OfficeCommissionAmount,
            CollectionRecipient = assignment.CollectionRecipient?.ToString(),
            CollectionStatus = assignment.CollectionStatus.ToString(),
            CollectionAmount = assignment.CollectionAmount,
            CollectionCycleDays = assignment.CollectionCycleDays,
            CollectionDueAt = assignment.CollectionDueAt,
            CollectionMethod = assignment.CollectionMethod,
            CollectionMethods = ParseMethods(assignment.CollectionMethodsSnapshot),
            CreatedAt = assignment.CreatedAt,
            AcceptedAt = assignment.AcceptedAt
        };

        private static string SerializeMethods(IEnumerable<string>? methods)
        {
            var normalized = (methods ?? Array.Empty<string>())
                .Select(m => m.Trim())
                .Where(m => !string.IsNullOrWhiteSpace(m))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (normalized.Count == 0)
            {
                normalized = new List<string> { "Cash", "Instapay", "COD" };
            }

            return JsonSerializer.Serialize(normalized);
        }

        private static List<string> ParseMethods(string? methodsJson)
        {
            if (string.IsNullOrWhiteSpace(methodsJson)) return new List<string>();
            try
            {
                return JsonSerializer.Deserialize<List<string>>(methodsJson) ?? new List<string>();
            }
            catch
            {
                return new List<string>();
            }
        }
    }
}
