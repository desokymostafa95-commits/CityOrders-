using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace CityOrders.Api.API.Controllers
{
    [Route("api/admin/delivery")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminDeliveryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminDeliveryController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        public async Task<ActionResult<DeliveryNetworkSummaryDto>> GetSummary()
        {
            var scope = await GetScopeAsync();
            if (scope == null) return Unauthorized();

            var officesQuery = _context.DeliveryOffices.AsQueryable();
            var agentsQuery = _context.DeliveryProfiles.AsQueryable();
            var assignmentsQuery = _context.DeliveryAssignments.AsQueryable();

            if (!scope.IsSystemAdmin)
            {
                if (!scope.OfficeId.HasValue) return Forbid();
                officesQuery = officesQuery.Where(o => o.Id == scope.OfficeId.Value);
                agentsQuery = agentsQuery.Where(a => a.DeliveryOfficeId == scope.OfficeId.Value);
                assignmentsQuery = assignmentsQuery.Where(a => a.DeliveryOfficeId == scope.OfficeId.Value || a.DeliveryOfficeId == null);
            }

            return Ok(new DeliveryNetworkSummaryDto
            {
                Offices = await officesQuery.CountAsync(),
                ActiveOffices = await officesQuery.CountAsync(o => o.IsActive),
                Agents = await agentsQuery.CountAsync(),
                AvailableAgents = await agentsQuery.CountAsync(a => a.IsActive && a.IsAvailable),
                PlatformOpenAssignments = await assignmentsQuery.CountAsync(a =>
                    a.Source == DeliveryAssignmentSource.PlatformPool &&
                    a.Status == DeliveryAssignmentStatus.Offered),
                AcceptedAssignments = await assignmentsQuery.CountAsync(a =>
                    a.Status == DeliveryAssignmentStatus.Accepted ||
                    a.Status == DeliveryAssignmentStatus.PickedUp)
            });
        }

        [HttpGet("offices")]
        public async Task<ActionResult<IEnumerable<DeliveryOfficeDto>>> GetOffices()
        {
            var scope = await GetScopeAsync();
            if (scope == null) return Unauthorized();

            var query = _context.DeliveryOffices
                .Include(o => o.ManagerUser)
                .Include(o => o.DeliveryAgents)
                .AsNoTracking()
                .AsQueryable();

            if (!scope.IsSystemAdmin)
            {
                if (!scope.OfficeId.HasValue) return Forbid();
                query = query.Where(o => o.Id == scope.OfficeId.Value);
            }

            var offices = await query.OrderBy(o => o.Name).ToListAsync();
            return Ok(offices.Select(ToOfficeDto));
        }

        [HttpGet("platform-settings")]
        public async Task<ActionResult<DeliveryPlatformSettingsDto>> GetPlatformSettings()
        {
            var scope = await GetScopeAsync();
            if (scope == null) return Unauthorized();
            if (!scope.IsSystemAdmin) return Forbid();

            var settings = await EnsurePlatformSettingsAsync();
            return Ok(ToPlatformSettingsDto(settings));
        }

        [HttpPut("platform-settings")]
        public async Task<ActionResult<DeliveryPlatformSettingsDto>> UpdatePlatformSettings([FromBody] UpdateDeliveryPlatformSettingsDto dto)
        {
            var scope = await GetScopeAsync();
            if (scope == null) return Unauthorized();
            if (!scope.IsSystemAdmin) return Forbid();

            var settings = await EnsurePlatformSettingsAsync();
            settings.IndependentPlatformCommissionPercent = dto.IndependentPlatformCommissionPercent;
            settings.IndependentCollectionCycleDays = dto.IndependentCollectionCycleDays;
            settings.IndependentCollectionMethodsJson = SerializeMethods(dto.IndependentCollectionMethods);
            settings.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(ToPlatformSettingsDto(settings));
        }

        [HttpPost("offices")]
        public async Task<ActionResult<DeliveryOfficeDto>> CreateOffice([FromBody] CreateDeliveryOfficeDto dto)
        {
            var scope = await GetScopeAsync();
            if (scope == null) return Unauthorized();
            if (!scope.IsSystemAdmin) return Forbid();

            if (await _context.Users.AnyAsync(u => u.Email == dto.ManagerEmail))
                return BadRequest("Manager email already exists.");

            var managerRole = await EnsureDeliveryOfficeManagerRoleAsync();
            var manager = new User
            {
                Name = dto.ManagerName.Trim(),
                Email = dto.ManagerEmail.Trim().ToLowerInvariant(),
                PasswordHash = PasswordHasher.HashPassword(dto.ManagerPassword),
                IsActive = true
            };
            manager.UserRoles.Add(new UserRole { Role = managerRole });

            var office = new DeliveryOffice
            {
                Name = dto.Name.Trim(),
                Phone = NormalizeOptional(dto.Phone),
                Address = NormalizeOptional(dto.Address),
                ManagerUser = manager,
                DefaultCommissionPercent = dto.DefaultCommissionPercent,
                AgentCollectionCycleDays = dto.AgentCollectionCycleDays,
                AgentCollectionMethodsJson = SerializeMethods(dto.AgentCollectionMethods),
                IsActive = true
            };

            _context.DeliveryOffices.Add(office);
            await _context.SaveChangesAsync();

            return Ok(ToOfficeDto(office));
        }

        [HttpPut("offices/{id}")]
        public async Task<ActionResult<DeliveryOfficeDto>> UpdateOffice(int id, [FromBody] UpdateDeliveryOfficeDto dto)
        {
            var scope = await GetScopeAsync();
            if (scope == null) return Unauthorized();

            var office = await _context.DeliveryOffices
                .Include(o => o.ManagerUser)
                .Include(o => o.DeliveryAgents)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (office == null) return NotFound();
            if (!scope.IsSystemAdmin && scope.OfficeId != id) return Forbid();

            if (!string.IsNullOrWhiteSpace(dto.Name)) office.Name = dto.Name.Trim();
            if (dto.Phone != null) office.Phone = NormalizeOptional(dto.Phone);
            if (dto.Address != null) office.Address = NormalizeOptional(dto.Address);
            if (dto.DefaultCommissionPercent.HasValue) office.DefaultCommissionPercent = dto.DefaultCommissionPercent.Value;
            if (dto.AgentCollectionCycleDays.HasValue) office.AgentCollectionCycleDays = dto.AgentCollectionCycleDays.Value;
            if (dto.AgentCollectionMethods != null) office.AgentCollectionMethodsJson = SerializeMethods(dto.AgentCollectionMethods);
            if (dto.IsActive.HasValue) office.IsActive = dto.IsActive.Value;
            office.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(ToOfficeDto(office));
        }

        [HttpGet("agents")]
        public async Task<ActionResult<IEnumerable<DeliveryAgentDto>>> GetAgents([FromQuery] int? officeId = null)
        {
            var scope = await GetScopeAsync();
            if (scope == null) return Unauthorized();

            var query = _context.DeliveryProfiles
                .Include(p => p.User)
                .Include(p => p.DeliveryOffice)
                .Include(p => p.MerchantUser)
                .AsNoTracking()
                .AsQueryable();

            if (!scope.IsSystemAdmin)
            {
                if (!scope.OfficeId.HasValue) return Forbid();
                query = query.Where(p => p.DeliveryOfficeId == scope.OfficeId.Value);
            }
            else if (officeId.HasValue)
            {
                query = query.Where(p => p.DeliveryOfficeId == officeId.Value);
            }

            var agents = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
            return Ok(agents.Select(ToAgentDto));
        }

        [HttpPost("offices/{officeId}/agents")]
        public async Task<ActionResult<DeliveryAgentDto>> CreateOfficeAgent(int officeId, [FromBody] CreateDeliveryAgentDto dto)
        {
            var scope = await GetScopeAsync();
            if (scope == null) return Unauthorized();
            if (!scope.IsSystemAdmin && scope.OfficeId != officeId) return Forbid();

            var office = await _context.DeliveryOffices.FindAsync(officeId);
            if (office == null) return NotFound("Delivery office not found.");
            if (!office.IsActive) return BadRequest("Delivery office is inactive.");
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Agent email already exists.");

            var agent = await CreateDeliveryUserAsync(dto, DeliveryAgentType.Office, officeId, null, null);
            await _context.SaveChangesAsync();

            return Ok(ToAgentDto(agent.DeliveryProfile!));
        }

        [HttpPost("agents/independent")]
        public async Task<ActionResult<DeliveryAgentDto>> CreateIndependentAgent([FromBody] CreateDeliveryAgentDto dto)
        {
            var scope = await GetScopeAsync();
            if (scope == null) return Unauthorized();
            if (!scope.IsSystemAdmin) return Forbid();
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Agent email already exists.");

            var agent = await CreateDeliveryUserAsync(dto, DeliveryAgentType.Independent, null, null, null);
            await _context.SaveChangesAsync();

            return Ok(ToAgentDto(agent.DeliveryProfile!));
        }

        [HttpPut("agents/{userId}")]
        public async Task<ActionResult<DeliveryAgentDto>> UpdateAgent(int userId, [FromBody] UpdateDeliveryAgentDto dto)
        {
            var scope = await GetScopeAsync();
            if (scope == null) return Unauthorized();

            var profile = await _context.DeliveryProfiles
                .Include(p => p.User)
                .Include(p => p.DeliveryOffice)
                .Include(p => p.MerchantUser)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null) return NotFound();
            if (!scope.IsSystemAdmin && profile.DeliveryOfficeId != scope.OfficeId) return Forbid();

            if (!string.IsNullOrWhiteSpace(dto.Name)) profile.User.Name = dto.Name.Trim();
            if (dto.Phone != null) profile.Phone = NormalizeOptional(dto.Phone);
            if (dto.VehicleType != null) profile.VehicleType = NormalizeOptional(dto.VehicleType);
            if (dto.IsActive.HasValue)
            {
                profile.IsActive = dto.IsActive.Value;
                profile.User.IsActive = dto.IsActive.Value;
                if (!dto.IsActive.Value) profile.IsAvailable = false;
            }
            if (dto.IsAvailable.HasValue) profile.IsAvailable = profile.IsActive && dto.IsAvailable.Value;
            if (dto.CommissionPercent.HasValue) profile.CommissionPercent = dto.CommissionPercent.Value;
            profile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(ToAgentDto(profile));
        }

        [HttpGet("assignments")]
        public async Task<ActionResult<IEnumerable<DeliveryAssignmentDto>>> GetAssignments([FromQuery] string? status = null)
        {
            var scope = await GetScopeAsync();
            if (scope == null) return Unauthorized();

            var query = _context.DeliveryAssignments
                .Include(a => a.Order).ThenInclude(o => o.Brand)
                .Include(a => a.Order).ThenInclude(o => o.Customer)
                .Include(a => a.AgentUser)
                .Include(a => a.DeliveryOffice)
                .AsNoTracking()
                .AsQueryable();

            if (!scope.IsSystemAdmin)
            {
                if (!scope.OfficeId.HasValue) return Forbid();
                query = query.Where(a => a.DeliveryOfficeId == scope.OfficeId.Value || a.DeliveryOfficeId == null);
            }

            if (!string.IsNullOrWhiteSpace(status) &&
                Enum.TryParse<DeliveryAssignmentStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(a => a.Status == parsedStatus);
            }

            var assignments = await query
                .OrderByDescending(a => a.CreatedAt)
                .Take(100)
                .ToListAsync();

            return Ok(assignments.Select(ToAssignmentDto));
        }

        [HttpPost("assignments/{id}/collect")]
        public async Task<ActionResult<DeliveryAssignmentDto>> MarkCollectionCollected(int id, [FromBody] MarkDeliveryCollectionDto dto)
        {
            var scope = await GetScopeAsync();
            if (scope == null) return Unauthorized();

            var assignment = await _context.DeliveryAssignments
                .Include(a => a.Order).ThenInclude(o => o.Brand)
                .Include(a => a.Order).ThenInclude(o => o.Customer)
                .Include(a => a.AgentUser)
                .Include(a => a.DeliveryOffice)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (assignment == null) return NotFound();
            if (assignment.CollectionStatus == DeliveryCollectionStatus.NotRequired)
                return BadRequest("This assignment has no required collection.");

            if (!scope.IsSystemAdmin)
            {
                if (assignment.CollectionRecipient != DeliveryCollectionRecipient.DeliveryOffice ||
                    assignment.DeliveryOfficeId != scope.OfficeId)
                {
                    return Forbid();
                }
            }

            var allowedMethods = ParseMethods(assignment.CollectionMethodsSnapshot);
            if (!string.IsNullOrWhiteSpace(dto.Method))
            {
                var method = dto.Method.Trim();
                if (allowedMethods.Count > 0 && !allowedMethods.Contains(method, StringComparer.OrdinalIgnoreCase))
                    return BadRequest("Collection method is not allowed for this assignment.");
                assignment.CollectionMethod = method;
            }

            assignment.CollectionStatus = DeliveryCollectionStatus.Collected;
            assignment.CollectedAt = DateTime.UtcNow;
            assignment.CollectedByUserId = scope.UserId;

            await _context.SaveChangesAsync();
            return Ok(ToAssignmentDto(assignment));
        }

        private async Task<User> CreateDeliveryUserAsync(CreateDeliveryAgentDto dto, DeliveryAgentType type, int? officeId, int? merchantUserId, decimal? commissionPercent)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                throw new InvalidOperationException("Email already exists.");

            var deliveryRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Delivery")
                ?? throw new InvalidOperationException("Delivery role not found.");

            var user = new User
            {
                Name = dto.Name.Trim(),
                Email = dto.Email.Trim().ToLowerInvariant(),
                PasswordHash = PasswordHasher.HashPassword(dto.Password),
                IsActive = true,
                DeliveryProfile = new DeliveryProfile
                {
                    AgentType = type,
                    DeliveryOfficeId = officeId,
                    MerchantUserId = merchantUserId,
                    Phone = NormalizeOptional(dto.Phone),
                    VehicleType = NormalizeOptional(dto.VehicleType),
                    CommissionPercent = commissionPercent,
                    IsActive = true,
                    IsAvailable = false
                }
            };
            user.UserRoles.Add(new UserRole { Role = deliveryRole });
            _context.Users.Add(user);
            return user;
        }

        private async Task<Role> EnsureDeliveryOfficeManagerRoleAsync()
        {
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "DeliveryOfficeManager");
            if (role != null) return role;

            role = new Role
            {
                Name = "DeliveryOfficeManager",
                IsCustom = true,
                Permissions = "[\"page:delivery-network\"]"
            };
            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
            return role;
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

        private async Task<AdminDeliveryScope?> GetScopeAsync()
        {
            var userIdText = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdText, out var userId)) return null;

            var isSystemAdmin = await _context.UserRoles
                .Include(ur => ur.Role)
                .AnyAsync(ur => ur.UserId == userId && ur.Role.Name == "Admin");

            var officeId = await _context.DeliveryOffices
                .Where(o => o.ManagerUserId == userId)
                .Select(o => (int?)o.Id)
                .FirstOrDefaultAsync();

            return new AdminDeliveryScope(userId, isSystemAdmin, officeId);
        }

        private static DeliveryOfficeDto ToOfficeDto(DeliveryOffice office) => new()
        {
            Id = office.Id,
            Name = office.Name,
            Phone = office.Phone,
            Address = office.Address,
            ManagerUserId = office.ManagerUserId,
            ManagerName = office.ManagerUser?.Name ?? string.Empty,
            ManagerEmail = office.ManagerUser?.Email ?? string.Empty,
            DefaultCommissionPercent = office.DefaultCommissionPercent,
            AgentCollectionCycleDays = office.AgentCollectionCycleDays,
            AgentCollectionMethods = ParseMethods(office.AgentCollectionMethodsJson),
            IsActive = office.IsActive,
            AgentsCount = office.DeliveryAgents?.Count ?? 0,
            AvailableAgentsCount = office.DeliveryAgents?.Count(a => a.IsActive && a.IsAvailable) ?? 0,
            CreatedAt = office.CreatedAt
        };

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
            AgentEarningAmount = assignment.AgentEarningAmount,
            OfficeCommissionAmount = assignment.OfficeCommissionAmount,
            CreatedAt = assignment.CreatedAt,
            AcceptedAt = assignment.AcceptedAt,
            PlatformCommissionAmount = assignment.PlatformCommissionAmount,
            CollectionRecipient = assignment.CollectionRecipient?.ToString(),
            CollectionStatus = assignment.CollectionStatus.ToString(),
            CollectionAmount = assignment.CollectionAmount,
            CollectionCycleDays = assignment.CollectionCycleDays,
            CollectionDueAt = assignment.CollectionDueAt,
            CollectionMethod = assignment.CollectionMethod,
            CollectionMethods = ParseMethods(assignment.CollectionMethodsSnapshot)
        };

        private static DeliveryPlatformSettingsDto ToPlatformSettingsDto(DeliveryPlatformSettings settings) => new()
        {
            IndependentPlatformCommissionPercent = settings.IndependentPlatformCommissionPercent,
            IndependentCollectionCycleDays = settings.IndependentCollectionCycleDays,
            IndependentCollectionMethods = ParseMethods(settings.IndependentCollectionMethodsJson)
        };

        private static string? NormalizeOptional(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();

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

        private record AdminDeliveryScope(int UserId, bool IsSystemAdmin, int? OfficeId);
    }
}
