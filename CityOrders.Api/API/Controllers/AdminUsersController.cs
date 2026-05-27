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
    [Route("api/adminusers")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminUsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminUsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult> GetAdmins()
        {
            var admins = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .Where(u => u.UserRoles.Any(ur => ur.Role.Name == "Admin" || (ur.Role.IsCustom && ur.Role.Permissions != "[]")))
                .Select(u => new
                {
                    u.Id,
                    u.Name,
                    u.Email,
                    u.IsActive,
                    Roles = u.UserRoles.Select(ur => new { ur.Role.Id, ur.Role.Name, ur.Role.IsCustom })
                })
                .ToListAsync();

            return Ok(admins);
        }

        [HttpGet("me/permissions")]
        public async Task<ActionResult> GetMyPermissions()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userIdString) || !int.TryParse(userIdString, out var userId))
                return Unauthorized();

            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return NotFound();

            var roles = user.UserRoles.Select(ur => new
            {
                ur.Role.Id,
                ur.Role.Name,
                ur.Role.IsCustom
            }).ToList();

            var isSystemAdmin = user.UserRoles.Any(ur => ur.Role.Name == "Admin");
            var permissions = isSystemAdmin
                ? new List<string> { "page:*" }
                : user.UserRoles
                    .Where(ur => ur.Role.IsCustom)
                    .SelectMany(ur => ParsePermissions(ur.Role.Permissions))
                    .Distinct()
                    .OrderBy(p => p)
                    .ToList();

            return Ok(new
            {
                IsSystemAdmin = isSystemAdmin,
                Permissions = permissions,
                Roles = roles
            });
        }

        [HttpPost]
        public async Task<ActionResult> CreateAdmin([FromBody] CreateAdminDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Email already exists");

            var role = await _context.Roles.FindAsync(dto.RoleId);
            if (role == null) return BadRequest("Role not found");
            if (role.Name != "Admin" && !role.IsCustom)
                return BadRequest("Can only assign Admin or Custom roles");

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = PasswordHasher.HashPassword(dto.Password),
                IsActive = true
            };

            user.UserRoles.Add(new UserRole { Role = role });


            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { user.Id, user.Name, user.Email });
        }

        [HttpPut("{id}/role")]
        public async Task<ActionResult> UpdateAdminRole(int id, [FromBody] UpdateAdminRoleDto dto)
        {
            var loggedInUserIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(loggedInUserIdString) && int.TryParse(loggedInUserIdString, out var loggedInUserId))
            {
                if (loggedInUserId == id)
                {
                    return BadRequest("لا يمكنك تعديل دورك الشخصي.");
                }
            }

            var user = await _context.Users.Include(u => u.UserRoles).FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound();

            var role = await _context.Roles.FindAsync(dto.RoleId);
            if (role == null) return BadRequest("Role not found");
            if (role.Name != "Admin" && !role.IsCustom)
                return BadRequest("Can only assign Admin or Custom roles");

            // Clear existing roles (assuming 1 role per admin for simplicity in UI, though schema supports many)
            _context.UserRoles.RemoveRange(user.UserRoles);
            
            user.UserRoles.Add(new UserRole { RoleId = role.Id });
            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteAdmin(int id)
        {
            var loggedInUserIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(loggedInUserIdString) && int.TryParse(loggedInUserIdString, out var loggedInUserId))
            {
                if (loggedInUserId == id)
                {
                    return BadRequest("لا يمكنك حذف حسابك الشخصي.");
                }
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            // 1. Handle DeliveryOffice if this user is a manager
            var managedOffice = await _context.DeliveryOffices
                .FirstOrDefaultAsync(o => o.ManagerUserId == id);
            if (managedOffice != null)
            {
                // Disassociate delivery profiles (agents)
                var profiles = await _context.DeliveryProfiles
                    .Where(p => p.DeliveryOfficeId == managedOffice.Id)
                    .ToListAsync();
                foreach (var profile in profiles)
                {
                    profile.DeliveryOfficeId = null;
                }

                // Disassociate delivery assignments
                var assignments = await _context.DeliveryAssignments
                    .Where(a => a.DeliveryOfficeId == managedOffice.Id)
                    .ToListAsync();
                foreach (var assignment in assignments)
                {
                    assignment.DeliveryOfficeId = null;
                }

                _context.DeliveryOffices.Remove(managedOffice);
            }

            // 2. Handle collected payments by this user
            var collectedAssignments = await _context.DeliveryAssignments
                .Where(a => a.CollectedByUserId == id)
                .ToListAsync();
            foreach (var assignment in collectedAssignments)
            {
                assignment.CollectedByUserId = null;
            }

            // 3. Handle chat threads and messages
            var userMessages = await _context.ChatMessages
                .Where(m => m.SenderUserId == id)
                .ToListAsync();
            _context.ChatMessages.RemoveRange(userMessages);

            var userThreads = await _context.ChatThreads
                .Where(t => t.AdminUserId == id)
                .ToListAsync();
            _context.ChatThreads.RemoveRange(userThreads);

            // 4. Remove UserRoles first to be safe
            var userRoles = await _context.UserRoles
                .Where(ur => ur.UserId == id)
                .ToListAsync();
            _context.UserRoles.RemoveRange(userRoles);

            // 5. Remove User
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private static List<string> ParsePermissions(string? permissionsJson)
        {
            if (string.IsNullOrWhiteSpace(permissionsJson)) return new List<string>();
            try
            {
                return JsonSerializer.Deserialize<List<string>>(permissionsJson) ?? new List<string>();
            }
            catch
            {
                return new List<string>();
            }
        }
    }

    public class CreateAdminDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public int RoleId { get; set; }
    }

    public class UpdateAdminRoleDto
    {
        public int RoleId { get; set; }
    }

}
