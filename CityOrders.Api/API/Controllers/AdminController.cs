using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CityOrders.Api.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public AdminController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet("dashboard-summary")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetDashboardSummary()
        {
            var now = DateTime.UtcNow;
            var sevenDaysAgo = now.AddDays(-7);
            var adminUserId = int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var parsedAdminId)
                ? parsedAdminId
                : 0;

            var totalOrders = await _context.Orders.CountAsync();
            var activeOrders = await _context.Orders.CountAsync(o =>
                o.Status == OrderStatus.Pending ||
                o.Status == OrderStatus.Accepted ||
                o.Status == OrderStatus.Preparing ||
                o.Status == OrderStatus.OutForDelivery);
            var lateThreshold = now.AddMinutes(-30);
            var lateActiveOrders = await _context.Orders.CountAsync(o =>
                o.CreatedAt <= lateThreshold &&
                (o.Status == OrderStatus.Pending ||
                 o.Status == OrderStatus.Accepted ||
                 o.Status == OrderStatus.Preparing ||
                 o.Status == OrderStatus.OutForDelivery));

            var deliveredRevenue = await _context.Orders
                .Where(o => o.Status == OrderStatus.Delivered)
                .SumAsync(o => (decimal?)o.Total) ?? 0m;

            var todaysRevenue = await _context.Orders
                .Where(o => o.Status == OrderStatus.Delivered && o.DeliveredAt.HasValue && o.DeliveredAt.Value >= now.Date)
                .SumAsync(o => (decimal?)o.Total) ?? 0m;

            var customers = await _context.UserRoles.CountAsync(ur => ur.Role.Name == "Customer");
            var merchants = await _context.UserRoles.CountAsync(ur => ur.Role.Name == "Merchant");
            var onlineMerchants = await _context.MerchantProfiles.CountAsync(mp => mp.IsActive && mp.IsApproved && mp.IsOnShift);
            var temporarilyClosedMerchants = await _context.MerchantProfiles.CountAsync(mp => mp.IsActive && mp.IsApproved && mp.IsTemporarilyClosed);
            var pendingApprovals = await _context.MerchantProfiles.CountAsync(mp => !mp.IsApproved && string.IsNullOrEmpty(mp.RejectionReason));
            var pendingPayments = await _context.SubscriptionPaymentRequests.CountAsync(pr => pr.Status == "Pending");
            var newCustomers = await _context.Users.CountAsync(u => u.CreatedAt >= sevenDaysAgo);
            var unreadAdminChats = await _context.ChatMessages.CountAsync(m =>
                m.Thread.Type == ChatThreadType.AdminMerchant &&
                m.Thread.AdminUserId == adminUserId &&
                m.SenderUserId != adminUserId &&
                m.ReadAt == null);
            var openChatThreads = await _context.ChatThreads.CountAsync(t =>
                t.Type == ChatThreadType.AdminMerchant && t.Messages.Any());

            var recentOrders = await _context.Orders
                .Include(o => o.Brand)
                .OrderByDescending(o => o.CreatedAt)
                .Take(6)
                .AsNoTracking()
                .Select(o => new
                {
                    o.Id,
                    o.OrderNumber,
                    BrandName = o.Brand.Name,
                    Status = o.Status.ToString(),
                    o.Total,
                    o.CreatedAt
                })
                .ToListAsync();
            var needsAttentionOrders = await _context.Orders
                .Include(o => o.Brand)
                .Where(o =>
                    o.CreatedAt <= lateThreshold &&
                    (o.Status == OrderStatus.Pending ||
                     o.Status == OrderStatus.Accepted ||
                     o.Status == OrderStatus.Preparing ||
                     o.Status == OrderStatus.OutForDelivery))
                .OrderBy(o => o.CreatedAt)
                .Take(6)
                .AsNoTracking()
                .Select(o => new
                {
                    o.Id,
                    o.OrderNumber,
                    BrandName = o.Brand.Name,
                    Status = o.Status.ToString(),
                    o.Total,
                    o.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                totalOrders,
                activeOrders,
                lateActiveOrders,
                deliveredRevenue,
                todaysRevenue,
                customers,
                merchants,
                onlineMerchants,
                temporarilyClosedMerchants,
                pendingApprovals,
                pendingPayments,
                newCustomers,
                unreadAdminChats,
                openChatThreads,
                recentOrders,
                needsAttentionOrders
            });
        }

        [HttpPost("create-admin")]
        public async Task<IActionResult> CreateAdmin([FromBody] CreateAdminDto dto)
        {
            // Logic: 
            // 1. If no admin exists, allow creating one IF (IsDevelopment OR FirstRun Allowed).
            // 2. If admin exists, only Admin can create Admin.

            bool adminExists = await _context.UserRoles.AnyAsync(ur => ur.Role.Name == "Admin");

            if (adminExists)
            {
                if (!User.Identity?.IsAuthenticated ?? true) return Unauthorized("Admin already exists. Please login as Admin.");
                if (!User.IsInRole("Admin")) return Forbid("Only Admins can create new Admins.");
            }
            else
            {
                // No admin exists. Allow only if Development.
                if (!_env.IsDevelopment()) return StatusCode(403, "Admin must be seeded or created in Development environment only.");
            }

            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Email already exists.");

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = PasswordHasher.HashPassword(dto.Password),
                IsActive = true
            };

            var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
            if (adminRole == null) return StatusCode(500, "Role not found.");

            user.UserRoles.Add(new UserRole { Role = adminRole });
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Admin created successfully." });
        }

        [HttpPost("approve-merchant/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveMerchant(int userId)
        {
            // Need to load MerchantProfile
            // But what if user exists but has no MerchantProfile? (e.g. was just a customer)
            // We should load User + Roles + Profile.
            
            var user = await _context.Users
                .Include(u => u.MerchantProfile)
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return NotFound("User not found.");

            if (user.MerchantProfile == null)
            {
                // Auto-create? Or Error? 
                // Let's error, they should Apply first.
                return BadRequest("User has not applied to be a merchant.");
            }

            if (user.MerchantProfile.IsApproved) return BadRequest("Merchant is already approved.");

            user.MerchantProfile.IsApproved = true;
            user.MerchantProfile.UpdatedAt = DateTime.UtcNow;

            // Ensure role
            var merchantRole = await _context.Roles.FirstAsync(r => r.Name == "Merchant");
            if (user.UserRoles.All(ur => ur.RoleId != merchantRole.Id))
            {
                user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = merchantRole.Id });
            }

            await _context.SaveChangesAsync();

            // Log Action
            _context.AuditLogs.Add(new AuditLog
            {
                Action = "MerchantApproved",
                Target = $"Merchant: {userId} ({user.Email})",
                Summary = $"Merchant approved and assigned Merchant role.",
                AdminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Unknown",
                AdminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown"
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Merchant approved." });
        }
        
        [HttpPost("reject-merchant/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RejectMerchant(int userId, [FromBody] RejectMerchantDto dto)
        {
            var user = await _context.Users
                .Include(u => u.MerchantProfile)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return NotFound("User not found.");
            if (user.MerchantProfile == null) return BadRequest("Merchant profile not found.");
            
            user.MerchantProfile.IsApproved = false;
            user.MerchantProfile.RejectionReason = dto.Reason;
            user.MerchantProfile.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();

            // Log Action
            _context.AuditLogs.Add(new AuditLog
            {
                Action = "MerchantRejected",
                Target = $"Merchant: {userId} ({user.Email})",
                Summary = $"Merchant application rejected. Reason: {dto.Reason}",
                AdminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Unknown",
                AdminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown"
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Merchant application rejected with reason stored." });
        }

        [HttpGet("merchant-applications")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetMerchantApplications([FromQuery] string status = "pending")
        {
            var query = _context.MerchantProfiles
                .Include(mp => mp.User)
                .Include(mp => mp.Brand)
                    .ThenInclude(b => b!.MasterCategories)
                .Include(mp => mp.Brand)
                    .ThenInclude(b => b!.MarketSector)
                .AsNoTracking();

            if (status.ToLower() == "pending")
                query = query.Where(mp => !mp.IsApproved && string.IsNullOrEmpty(mp.RejectionReason));
            else if (status.ToLower() == "rejected")
                query = query.Where(mp => !mp.IsApproved && !string.IsNullOrEmpty(mp.RejectionReason));
            else if (status.ToLower() == "approved")
                query = query.Where(mp => mp.IsApproved);

            var applications = await query
                .Select(mp => new
                {
                    mp.UserId,
                    UserName = mp.User.Name,
                    Email = mp.User.Email,
                    BrandName = mp.Brand != null ? mp.Brand.Name : null,
                    BrandAddress = mp.Brand != null ? mp.Brand.Address : null,
                    BrandPhone = mp.Brand != null ? mp.Brand.Phone1 : null,
                    LogoUrl = mp.Brand != null ? mp.Brand.LogoUrl : null,
                    MarketSectorId = mp.Brand != null ? mp.Brand.MarketSectorId : (int?)null,
                    MarketSectorName = mp.Brand != null ? mp.Brand.MarketSector.Name : null,
                    MarketSectorSlug = mp.Brand != null ? mp.Brand.MarketSector.Slug : null,
                    Lat = mp.Brand != null ? mp.Brand.LocationLat : null,
                    Lng = mp.Brand != null ? mp.Brand.LocationLng : null,
                    MasterCategories = mp.Brand != null ? mp.Brand.MasterCategories.Select(c => c.Name).ToList() : new List<string>(),
                    MasterCategoryIds = mp.Brand != null ? mp.Brand.MasterCategories.Select(c => c.Id).ToList() : new List<int>(),
                    mp.ApprovalRequestReason,
                    mp.CreatedAt,
                    mp.IsOnShift,
                    mp.ShiftAutoCloseAt
                })
                .OrderByDescending(mp => mp.CreatedAt)
                .ToListAsync();

            return Ok(applications);
        }


        // ==================== Merchant Activation Control ====================


        // ==================== Subscription Plan Management ====================


        [HttpPost("subscription-plans")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Subscriptions")]
        public async Task<IActionResult> CreateSubscriptionPlan([FromBody] CreateSubscriptionPlanDto dto)
        {
            if (await _context.SubscriptionPlans.AnyAsync(sp => sp.Name == dto.Name))
                return BadRequest("A plan with this name already exists.");

            var plan = new SubscriptionPlan
            {
                Name = dto.Name,
                PriceEgp = dto.PriceEgp,
                DurationDays = dto.DurationDays,
                GraceDays = dto.GraceDays,
                MaxConcurrentOffers = dto.MaxConcurrentOffers
            };

            _context.SubscriptionPlans.Add(plan);
            await _context.SaveChangesAsync();

            // Log Action
            _context.AuditLogs.Add(new AuditLog
            {
                Action = "PlanCreated",
                Target = $"Plan: {plan.Id} ({plan.Name})",
                Summary = $"Subscription plan created. Price: {plan.PriceEgp} EGP, Duration: {plan.DurationDays} days.",
                AdminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Unknown",
                AdminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown"
            });
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSubscriptionPlans), new { id = plan.Id }, new { id = plan.Id, message = "Plan created successfully." });
        }

        [HttpGet("subscription-plans")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Subscriptions")]
        public async Task<IActionResult> GetSubscriptionPlans()
        {
            var plans = await _context.SubscriptionPlans
                .AsNoTracking()
                .Select(sp => new SubscriptionPlanDto
                {
                    Id = sp.Id,
                    Name = sp.Name,
                    PriceEgp = sp.PriceEgp,
                    DurationDays = sp.DurationDays,
                    GraceDays = sp.GraceDays,
                    IsEnabled = sp.IsEnabled,
                    MaxConcurrentOffers = sp.MaxConcurrentOffers
                })
                .ToListAsync();

            return Ok(plans);
        }

        [HttpPut("subscription-plans/{id}")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Subscriptions")]
        public async Task<IActionResult> UpdateSubscriptionPlan(int id, [FromBody] UpdateSubscriptionPlanDto dto)
        {
            var plan = await _context.SubscriptionPlans.FindAsync(id);
            if (plan == null) return NotFound("Plan not found.");

            if (dto.Name != null)
            {
                if (await _context.SubscriptionPlans.AnyAsync(sp => sp.Name == dto.Name && sp.Id != id))
                    return BadRequest("A plan with this name already exists.");
                plan.Name = dto.Name;
            }

            if (dto.PriceEgp.HasValue) plan.PriceEgp = dto.PriceEgp.Value;
            if (dto.DurationDays.HasValue) plan.DurationDays = dto.DurationDays.Value;
            if (dto.GraceDays.HasValue) plan.GraceDays = dto.GraceDays.Value;
            if (dto.MaxConcurrentOffers.HasValue) plan.MaxConcurrentOffers = dto.MaxConcurrentOffers.Value;

            plan.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Log Action
            _context.AuditLogs.Add(new AuditLog
            {
                Action = "PlanUpdated",
                Target = $"Plan: {id} ({plan.Name})",
                Summary = $"Subscription plan updated.",
                AdminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Unknown",
                AdminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown"
            });
            await _context.SaveChangesAsync();

            return Ok(new SubscriptionPlanDto
            {
                Id = plan.Id,
                Name = plan.Name,
                PriceEgp = plan.PriceEgp,
                DurationDays = plan.DurationDays,
                GraceDays = plan.GraceDays,
                IsEnabled = plan.IsEnabled,
                MaxConcurrentOffers = plan.MaxConcurrentOffers
            });
        }

        [HttpPatch("subscription-plans/{id}/toggle")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Subscriptions")]
        public async Task<IActionResult> ToggleSubscriptionPlan(int id)
        {
            var plan = await _context.SubscriptionPlans.FindAsync(id);
            if (plan == null) return NotFound("Plan not found.");

            plan.IsEnabled = !plan.IsEnabled;
            plan.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Log Action
            _context.AuditLogs.Add(new AuditLog
            {
                Action = "PlanToggled",
                Target = $"Plan: {id} ({plan.Name})",
                Summary = $"Subscription plan {(plan.IsEnabled ? "enabled" : "disabled")}.",
                AdminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Unknown",
                AdminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown"
            });
            await _context.SaveChangesAsync();

            return Ok(new { isEnabled = plan.IsEnabled });
        }

        [HttpDelete("subscription-plans/{id}")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Subscriptions")]
        public async Task<IActionResult> DeleteSubscriptionPlan(int id)
        {
            var plan = await _context.SubscriptionPlans.FindAsync(id);
            if (plan == null) return NotFound("Plan not found.");

            // Cascading deletion: remove all subscriptions and payment requests using this plan
            var relatedSubscriptions = _context.MerchantSubscriptions.Where(ms => ms.PlanId == id);
            var relatedPaymentRequests = _context.SubscriptionPaymentRequests.Where(spr => spr.PlanId == id);

            _context.MerchantSubscriptions.RemoveRange(relatedSubscriptions);
            _context.SubscriptionPaymentRequests.RemoveRange(relatedPaymentRequests);

            var planName = plan.Name;
            _context.SubscriptionPlans.Remove(plan);
            await _context.SaveChangesAsync();

            // Log Action
            _context.AuditLogs.Add(new AuditLog
            {
                Action = "PlanDeleted",
                Target = $"Plan: {id} ({planName})",
                Summary = $"Subscription plan deleted by Admin. Associated subscriptions and payment requests were also removed.",
                AdminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Unknown",
                AdminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown"
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Plan and all associated data deleted successfully." });
        }

        // ==================== Payment Request Review ====================

        [HttpGet("payment-requests")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Subscriptions")]
        public async Task<IActionResult> GetPaymentRequests(
            [FromQuery] string status = "Pending",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var query = _context.SubscriptionPaymentRequests
                .Include(spr => spr.User)
                .Include(spr => spr.Plan)
                .AsNoTracking();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(spr => spr.Status == status);

            var requests = await query
                .OrderByDescending(spr => spr.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(spr => new PaymentRequestListDto
                {
                    Id = spr.Id,
                    MerchantUserId = spr.UserId,
                    MerchantName = spr.User.Name,
                    MerchantEmail = spr.User.Email,
                    PlanName = spr.Plan.Name,
                    PlanPriceEgp = spr.Plan.PriceEgp,
                    ProofFileUrl = spr.ProofFilePath,
                    PayerNumber = spr.PayerNumber,
                    Status = spr.Status,
                    CreatedAt = spr.CreatedAt
                })
                .ToListAsync();

            return Ok(requests);
        }

        [HttpPost("payment-requests/{id}/approve")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Subscriptions")]
        public async Task<IActionResult> ApprovePaymentRequest(int id)
        {
            var request = await _context.SubscriptionPaymentRequests
                .Include(spr => spr.Plan)
                .FirstOrDefaultAsync(spr => spr.Id == id);

            if (request == null) return NotFound("Payment request not found.");
            if (request.Status != "Pending") return BadRequest("Only pending requests can be approved.");

            // Get admin user ID
            var adminUserIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (adminUserIdClaim == null) return Unauthorized();
            var adminUserId = int.Parse(adminUserIdClaim.Value);

            // Get or create merchant subscription
            var subscription = await _context.MerchantSubscriptions
                .FirstOrDefaultAsync(ms => ms.UserId == request.UserId);

            DateTime newStartDate;
            if (subscription != null)
            {
                // If Active or Grace, extend from current EndDate
                var currentState = subscription.GetState();
                if (currentState == "Active" || currentState == "Grace")
                {
                    newStartDate = subscription.EndDate;
                }
                else
                {
                    // Expired - start from now
                    newStartDate = DateTime.UtcNow;
                }

                subscription.PlanId = request.PlanId;
                subscription.IsTrial = false;
                subscription.StartDate = newStartDate;
                subscription.EndDate = newStartDate.AddDays(request.Plan.DurationDays);
                subscription.GraceEndDate = subscription.EndDate.AddDays(request.Plan.GraceDays);
                subscription.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                // Create new subscription
                newStartDate = DateTime.UtcNow;
                subscription = new MerchantSubscription
                {
                    UserId = request.UserId,
                    PlanId = request.PlanId,
                    IsTrial = false,
                    StartDate = newStartDate,
                    EndDate = newStartDate.AddDays(request.Plan.DurationDays),
                    GraceEndDate = newStartDate.AddDays(request.Plan.DurationDays + request.Plan.GraceDays)
                };
                _context.MerchantSubscriptions.Add(subscription);
            }

            // Activate and Approve merchant
            var userWithProfile = await _context.Users
                .Include(u => u.MerchantProfile)
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.Id == request.UserId);

            if (userWithProfile?.MerchantProfile != null)
            {
                userWithProfile.MerchantProfile.IsApproved = true; // Approved on first payment
                userWithProfile.MerchantProfile.IsActive = true;
                userWithProfile.MerchantProfile.UpdatedAt = DateTime.UtcNow;

                // Ensure "Merchant" role is present
                var merchantRole = await _context.Roles.FirstAsync(r => r.Name == "Merchant");
                if (userWithProfile.UserRoles.All(ur => ur.RoleId != merchantRole.Id))
                {
                    userWithProfile.UserRoles.Add(new UserRole { UserId = userWithProfile.Id, RoleId = merchantRole.Id });
                }
            }

            // Update payment request
            request.Status = "Approved";
            request.ReviewedByUserId = adminUserId;
            request.ReviewedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log Action
            _context.AuditLogs.Add(new AuditLog
            {
                Action = "PaymentApproved",
                Target = $"Merchant: {request.UserId} (Req: {id})",
                Summary = $"Subscription payment approved for plan {request.Plan.Name}. New EndDate: {subscription.EndDate:yyyy-MM-dd}.",
                AdminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Unknown",
                AdminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown"
            });
            await _context.SaveChangesAsync();

            return Ok(new ApprovePaymentResultDto
            {
                Message = "Subscription activated.",
                SubscriptionEndDate = subscription.EndDate,
                GraceEndDate = subscription.GraceEndDate
            });
        }

        [HttpPost("payment-requests/{id}/reject")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Subscriptions")]
        public async Task<IActionResult> RejectPaymentRequest(int id, [FromBody] RejectPaymentRequestDto dto)
        {
            var request = await _context.SubscriptionPaymentRequests.FindAsync(id);
            if (request == null) return NotFound("Payment request not found.");
            if (request.Status != "Pending") return BadRequest("Only pending requests can be rejected.");

            var adminUserIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (adminUserIdClaim == null) return Unauthorized();
            var adminUserId = int.Parse(adminUserIdClaim.Value);

            request.Status = "Rejected";
            request.AdminNotes = dto.Reason;
            request.ReviewedByUserId = adminUserId;
            request.ReviewedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log Action
            _context.AuditLogs.Add(new AuditLog
            {
                Action = "PaymentRejected",
                Target = $"Merchant: {request.UserId} (Req: {id})",
                Summary = $"Subscription payment rejected. Reason: {dto.Reason}",
                AdminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Unknown",
                AdminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown"
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Payment request rejected." });
        }

        // ==================== NEW: Subscriptions Monitoring & Manual Actions ====================

        [HttpGet("subscriptions-monitoring")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Subscriptions")]
        public async Task<IActionResult> GetSubscriptionsMonitoring(
            [FromQuery] string filter = "expiringSoon",
            [FromQuery] int days = 7,
            [FromQuery] string search = "")
        {
            var now = DateTime.UtcNow;
            var query = _context.MerchantSubscriptions
                .Include(ms => ms.User)
                .Include(ms => ms.User.MerchantProfile!)
                .Include(ms => ms.User.MerchantProfile!.Brand!)
                    .ThenInclude(b => b.MasterCategories)
                .Include(ms => ms.User.MerchantProfile!.Brand!)
                    .ThenInclude(b => b.MarketSector)
                .AsNoTracking();

            // Apply search
            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(ms => 
                    ms.User.Name.Contains(search) || 
                    ms.User.Email.Contains(search) || 
                    (ms.User.MerchantProfile != null &&
                     ms.User.MerchantProfile.Brand != null &&
                     (ms.User.MerchantProfile.Brand.Name.Contains(search) ||
                      (ms.User.MerchantProfile.Brand.Phone1 != null && ms.User.MerchantProfile.Brand.Phone1.Contains(search)))));
            }

            var subscriptions = await query.ToListAsync();

            // Filter by state
            IEnumerable<MerchantSubscription> filtered;

            if (filter == "deactivated")
            {
                filtered = subscriptions.Where(ms => ms.User.MerchantProfile?.IsActive == false);
            }
            else
            {
                // All other filters only show Active (not deactivated) merchants
                var activeMerchants = subscriptions.Where(ms => ms.User.MerchantProfile?.IsActive == true);
                
                if (filter == "expiringSoon")
                    filtered = activeMerchants.Where(ms => ms.GetState() == "Active" && (ms.EndDate - now).TotalDays <= days);
                else if (filter == "grace")
                    filtered = activeMerchants.Where(ms => ms.GetState() == "Grace");
                else if (filter == "expired")
                    filtered = activeMerchants.Where(ms => ms.GetState() == "Expired");
                else if (filter == "active")
                    filtered = activeMerchants.Where(ms => ms.GetState() == "Active");
                else
                    filtered = activeMerchants;
            }

            var result = filtered.Select(ms => new MerchantSubscriptionMonitoringDto
            {
                UserId = ms.UserId,
                UserName = ms.User.Name,
                Email = ms.User.Email,
                BrandName = ms.User.MerchantProfile?.Brand?.Name ?? "N/A",
                BrandPhone = ms.User.MerchantProfile?.Brand?.Phone1 ?? "N/A",
                BrandAddress = ms.User.MerchantProfile?.Brand?.Address ?? "N/A",
                LogoUrl = ms.User.MerchantProfile?.Brand?.LogoUrl,
                Lat = ms.User.MerchantProfile?.Brand?.LocationLat,
                Lng = ms.User.MerchantProfile?.Brand?.LocationLng,
                State = ms.GetState(),
                EndDate = ms.EndDate,
                DaysRemaining = ms.GetDaysRemaining(),
                GraceEndDate = ms.GraceEndDate,
                IsOnShift = ms.User.MerchantProfile?.IsOnShift ?? false,
                ShiftAutoCloseAt = ms.User.MerchantProfile?.ShiftAutoCloseAt,
                IsActive = ms.User.MerchantProfile?.IsActive ?? false,
                IsApproved = ms.User.MerchantProfile?.IsApproved ?? false,
                IsTemporarilyClosed = ms.User.MerchantProfile?.IsTemporarilyClosed ?? false,
                ApprovalRequestReason = ms.User.MerchantProfile?.ApprovalRequestReason,
                MarketSectorId = ms.User.MerchantProfile?.Brand?.MarketSectorId,
                MarketSectorName = ms.User.MerchantProfile?.Brand?.MarketSector?.Name,
                MarketSectorSlug = ms.User.MerchantProfile?.Brand?.MarketSector?.Slug,
                MasterCategories = ms.User.MerchantProfile?.Brand?.MasterCategories.Select(c => c.Name).ToList() ?? new List<string>(),
                MasterCategoryIds = ms.User.MerchantProfile?.Brand?.MasterCategories.Select(c => c.Id).ToList() ?? new List<int>()
            });

            return Ok(result);
        }

        [HttpGet("merchants/{userId}/subscription")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Subscriptions")]
        public async Task<IActionResult> GetMerchantSubscriptionDetails(int userId)
        {
            var ms = await _context.MerchantSubscriptions
                .Include(ms => ms.User)
                .Include(ms => ms.User.MerchantProfile!)
                .ThenInclude(mp => mp.Brand)
                    .ThenInclude(b => b!.MasterCategories)
                .Include(ms => ms.User.MerchantProfile!)
                .ThenInclude(mp => mp.Brand)
                    .ThenInclude(b => b!.MarketSector)
                .Include(ms => ms.Plan)
                .FirstOrDefaultAsync(ms => ms.UserId == userId);

            if (ms == null) return NotFound("Subscription not found.");

            return Ok(new AdminSubscriptionDetailsDto
            {
                UserId = ms.UserId,
                UserName = ms.User.Name,
                Email = ms.User.Email,
                BrandName = ms.User.MerchantProfile?.Brand?.Name ?? "N/A",
                BrandPhone = ms.User.MerchantProfile?.Brand?.Phone1 ?? "N/A",
                BrandAddress = ms.User.MerchantProfile?.Brand?.Address ?? "N/A",
                LogoUrl = ms.User.MerchantProfile?.Brand?.LogoUrl,
                Lat = ms.User.MerchantProfile?.Brand?.LocationLat,
                Lng = ms.User.MerchantProfile?.Brand?.LocationLng,
                State = ms.GetState(),
                EndDate = ms.EndDate,
                DaysRemaining = ms.GetDaysRemaining(),
                GraceEndDate = ms.GraceEndDate,
                MarketSectorId = ms.User.MerchantProfile?.Brand?.MarketSectorId,
                MarketSectorName = ms.User.MerchantProfile?.Brand?.MarketSector?.Name,
                MarketSectorSlug = ms.User.MerchantProfile?.Brand?.MarketSector?.Slug,
                MasterCategories = ms.User.MerchantProfile?.Brand?.MasterCategories.Select(c => c.Name).ToList() ?? new List<string>(),
                MasterCategoryIds = ms.User.MerchantProfile?.Brand?.MasterCategories.Select(c => c.Id).ToList() ?? new List<int>(),
                PlanName = ms.Plan?.Name ?? (ms.IsTrial ? "Free Trial" : "Custom"),
                StartDate = ms.StartDate,
                IsTrial = ms.IsTrial,
                IsActive = ms.User.MerchantProfile?.IsActive ?? false,
                IsApproved = ms.User.MerchantProfile?.IsApproved ?? false,
                ApprovalRequestReason = ms.User.MerchantProfile?.ApprovalRequestReason,
                IsOnShift = ms.User.MerchantProfile?.IsOnShift ?? false,
                IsTemporarilyClosed = ms.User.MerchantProfile?.IsTemporarilyClosed ?? false
            });
        }

        [HttpPost("subscriptions/{userId}/extend")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Subscriptions")]
        public async Task<IActionResult> ExtendSubscription(int userId, [FromBody] ExtendSubscriptionDto dto)
        {
            var ms = await _context.MerchantSubscriptions
                .Include(ms => ms.User)
                .FirstOrDefaultAsync(ms => ms.UserId == userId);

            if (ms == null) return NotFound("Subscription not found.");

            var oldEndDate = ms.EndDate;
            ms.EndDate = ms.EndDate.AddDays(dto.Days);
            ms.GraceEndDate = ms.GraceEndDate.AddDays(dto.Days);
            ms.UpdatedAt = DateTime.UtcNow;

            // Log Action
            _context.AuditLogs.Add(new AuditLog
            {
                Action = "SubscriptionExtend",
                Target = $"Merchant: {userId} ({ms.User.Email})",
                Summary = $"Extended by {dto.Days} days. Reason: {dto.Reason ?? "None"}. Old EndDate: {oldEndDate:yyyy-MM-dd}, New: {ms.EndDate:yyyy-MM-dd}",
                AdminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Unknown",
                AdminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown"
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Subscription extended." });
        }

        [HttpPost("subscriptions/{userId}/force-expire")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Subscriptions")]
        public async Task<IActionResult> ForceExpireSubscription(int userId)
        {
            var ms = await _context.MerchantSubscriptions
                .Include(ms => ms.User)
                .FirstOrDefaultAsync(ms => ms.UserId == userId);

            if (ms == null) return NotFound("Subscription not found.");

            var now = DateTime.UtcNow.AddMinutes(-1); // Set to past
            ms.EndDate = now;
            ms.GraceEndDate = now;
            ms.UpdatedAt = DateTime.UtcNow;

            // Log Action
            _context.AuditLogs.Add(new AuditLog
            {
                Action = "ForceExpire",
                Target = $"Merchant: {userId} ({ms.User.Email})",
                Summary = "Forcefully expired subscription by Admin.",
                AdminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Unknown",
                AdminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown"
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Subscription force-expired." });
        }

        [HttpGet("audit")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Audit")]
        public async Task<IActionResult> GetAuditLogs(
            [FromQuery] string? type,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = _context.AuditLogs.AsNoTracking();

            if (!string.IsNullOrEmpty(type))
                query = query.Where(al => al.Action == type);

            if (from.HasValue)
                query = query.Where(al => al.Timestamp >= from.Value);

            if (to.HasValue)
                query = query.Where(al => al.Timestamp <= to.Value);

            var logs = await query
                .OrderByDescending(al => al.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(al => new AuditLogDto
                {
                    Id = al.Id,
                    Timestamp = al.Timestamp,
                    Action = al.Action,
                    Target = al.Target,
                    Summary = al.Summary,
                    AdminName = al.AdminName,
                    AdminEmail = al.AdminEmail
                })
                .ToListAsync();

            return Ok(logs);
        }
        
        [HttpPost("merchants/{userId}/categories")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Merchants")]
        public async Task<IActionResult> UpdateMerchantCategories(int userId, [FromBody] List<int> categoryIds)
        {
            var brand = await _context.Brands
                .Include(b => b.MasterCategories)
                .Include(b => b.MarketSector)
                .Include(b => b.MerchantProfile)
                .FirstOrDefaultAsync(b => b.MerchantUserId == userId);

            if (brand == null) return NotFound("Brand not found for this merchant.");

            var categories = await _context.Categories
                .Where(c => categoryIds.Contains(c.Id))
                .ToListAsync();

            if (categories.Count != categoryIds.Distinct().Count())
                return BadRequest("One or more categories were not found.");

            var sectorIds = categories.Select(c => c.MarketSectorId).Distinct().ToList();
            if (sectorIds.Count > 1)
                return BadRequest("All merchant categories must belong to the same market sector.");

            if (sectorIds.Count == 1)
                brand.MarketSectorId = sectorIds[0];

            brand.MasterCategories.Clear();
            
            foreach (var cat in categories) brand.MasterCategories.Add(cat);

            if (brand.MerchantProfile != null)
            {
                brand.MerchantProfile.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // Log Action
            _context.AuditLogs.Add(new AuditLog
            {
                Action = "AdminUpdatedMerchantCategories",
                Target = $"Merchant: {userId}",
                Summary = $"Admin manually updated merchant categories to: {string.Join(", ", categories.Select(c => c.Name))}",
                AdminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Unknown",
                AdminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown"
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Merchant categories updated successfully." });
        }

        [HttpPost("merchants/{merchantId}/activate")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Merchants")]
        public async Task<IActionResult> ActivateMerchant(int merchantId)
        {
            var profile = await _context.MerchantProfiles
                .Include(mp => mp.User)
                .FirstOrDefaultAsync(mp => mp.UserId == merchantId);

            if (profile == null) return NotFound("Merchant profile not found.");

            if (profile.IsActive) return BadRequest("Merchant is already active.");

            profile.IsActive = true;
            profile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log Action
            _context.AuditLogs.Add(new AuditLog
            {
                Action = "MerchantActivated",
                Target = $"Merchant: {merchantId} ({profile.User.Email})",
                Summary = "Merchant profile manually activated by Admin.",
                AdminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Unknown",
                AdminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown"
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Merchant activated." });
        }

        [HttpPost("merchants/{merchantId}/deactivate")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Merchants")]
        public async Task<IActionResult> DeactivateMerchant(int merchantId)
        {
            var profile = await _context.MerchantProfiles
                .Include(mp => mp.User)
                .Include(mp => mp.Brand)
                .FirstOrDefaultAsync(mp => mp.UserId == merchantId);

            if (profile == null) return NotFound("Merchant profile not found.");

            if (!profile.IsActive) return BadRequest("Merchant is already deactivated.");

            profile.IsActive = false;
            profile.UpdatedAt = DateTime.UtcNow;

            // Also close shifts if active
            if (profile.Brand != null)
            {
                var currentShift = await _context.MerchantShifts
                    .Where(s => s.BrandId == profile.Brand.Id && s.Status == ShiftStatus.Open)
                    .OrderByDescending(s => s.StartAt)
                    .FirstOrDefaultAsync();

                if (currentShift != null)
                {
                    var closeTime = DateTime.UtcNow;
                    var brandId = profile.Brand.Id;

                    // 1. Get all delivered orders since shift started
                    var orders = await _context.Orders
                        .Include(o => o.Items)
                        .Where(o => o.BrandId == brandId && 
                                    o.Status == OrderStatus.Delivered && 
                                    o.DeliveredAt >= currentShift.StartAt)
                        .ToListAsync();

                    // 2. Generate line items (aggregated by product)
                    var lines = orders.SelectMany(o => o.Items)
                        .GroupBy(i => new { i.ProductId, i.ProductNameSnapshot, i.UnitPriceSnapshot })
                        .Select(g => new MerchantShiftLine
                        {
                            ProductId = g.Key.ProductId,
                            ProductNameSnapshot = g.Key.ProductNameSnapshot,
                            UnitPriceSnapshot = g.Key.UnitPriceSnapshot,
                            Quantity = g.Sum(i => i.Quantity),
                            LineTotal = g.Sum(i => i.LineTotal)
                        }).ToList();

                    // 3. Map orders to shift orders
                    var shiftOrders = orders.Select(o => new MerchantShiftOrder
                    {
                        OrderId = o.Id,
                        OrderNumberSnapshot = o.OrderNumber,
                        TotalSnapshot = o.Total,
                        DeliveredAtSnapshot = o.DeliveredAt ?? o.CreatedAt // Fallback just in case
                    }).ToList();

                    // 4. Update shift
                    currentShift.Status = ShiftStatus.Closed;
                    currentShift.EndAt = closeTime;
                    currentShift.ClosedAt = closeTime;
                    currentShift.DeliveredOrdersCount = orders.Count;
                    currentShift.GrossSales = orders.Sum(o => o.Total);
                    currentShift.Currency = "EGP"; // Could be dynamic
                    currentShift.BrandNameSnapshot = profile.Brand.Name;
                    currentShift.BrandAddressSnapshot = profile.Brand.Address;
                    currentShift.BrandPhoneSnapshot = profile.Brand.Phone1;
                    
                    currentShift.Lines = lines;
                    currentShift.Orders = shiftOrders;
                }
            }

            profile.IsOnShift = false;
            profile.ShiftUpdatedAt = DateTime.UtcNow;
            profile.ShiftAutoCloseAt = null;

            await _context.SaveChangesAsync();

            // Log Action
            _context.AuditLogs.Add(new AuditLog
            {
                Action = "MerchantDeactivated",
                Target = $"Merchant: {merchantId} ({profile.User.Email})",
                Summary = "Merchant profile manually deactivated by Admin. Open shifts closed.",
                AdminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Unknown",
                AdminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown"
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Merchant deactivated." });
        }
    }

}
