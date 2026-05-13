using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
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
