using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityOrders.Api.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminRolesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminRolesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetRoles()
        {
            var roles = await _context.Roles
                .Select(r => new
                {
                    r.Id,
                    r.Name,
                    r.IsCustom,
                    r.Permissions
                })
                .ToListAsync();

            return Ok(roles);
        }

        [HttpPost]
        public async Task<ActionResult> CreateRole([FromBody] CreateRoleDto dto)
        {
            if (await _context.Roles.AnyAsync(r => r.Name == dto.Name))
                return BadRequest("Role name already exists");

            var role = new Role
            {
                Name = dto.Name,
                IsCustom = true,
                Permissions = dto.PermissionsJson ?? "[]"
            };

            _context.Roles.Add(role);
            await _context.SaveChangesAsync();

            return Ok(new { role.Id, role.Name, role.Permissions, role.IsCustom });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateRole(int id, [FromBody] UpdateRoleDto dto)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null) return NotFound();

            if (!role.IsCustom)
                return BadRequest("Cannot modify system roles");

            if (!string.IsNullOrEmpty(dto.Name) && dto.Name != role.Name)
            {
                if (await _context.Roles.AnyAsync(r => r.Name == dto.Name))
                    return BadRequest("Role name already exists");
                role.Name = dto.Name;
            }

            if (dto.PermissionsJson != null)
            {
                role.Permissions = dto.PermissionsJson;
            }

            await _context.SaveChangesAsync();
            return Ok(new { role.Id, role.Name, role.Permissions, role.IsCustom });
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteRole(int id)
        {
            var role = await _context.Roles.Include(r => r.UserRoles).FirstOrDefaultAsync(r => r.Id == id);
            if (role == null) return NotFound();

            if (!role.IsCustom)
                return BadRequest("Cannot delete system roles");

            if (role.UserRoles.Any())
                return BadRequest("Cannot delete a role that is assigned to users");

            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class CreateRoleDto
    {
        public string Name { get; set; } = string.Empty;
        public string? PermissionsJson { get; set; }
    }

    public class UpdateRoleDto
    {
        public string? Name { get; set; }
        public string? PermissionsJson { get; set; }
    }
}
