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
    public class AnnouncementsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AnnouncementsController(AppDbContext context)
        {
            _context = context;
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GlobalAnnouncement>>> GetAnnouncements()
        {
            return await _context.Announcements
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<GlobalAnnouncement>> CreateAnnouncement([FromBody] CreateAnnouncementDto dto)
        {
            var announcement = new GlobalAnnouncement
            {
                Message = dto.Message,
                TargetAudience = dto.TargetAudience,
                ExpiresAt = dto.ExpiresAt,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Announcements.Add(announcement);
            await _context.SaveChangesAsync();

            return Ok(announcement);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/toggle")]
        public async Task<IActionResult> ToggleAnnouncement(int id)
        {
            var announcement = await _context.Announcements.FindAsync(id);
            if (announcement == null) return NotFound();

            announcement.IsActive = !announcement.IsActive;
            await _context.SaveChangesAsync();

            return Ok(new { announcement.Id, announcement.IsActive });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAnnouncement(int id)
        {
            var announcement = await _context.Announcements.FindAsync(id);
            if (announcement == null) return NotFound();

            _context.Announcements.Remove(announcement);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [Authorize]
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<GlobalAnnouncement>>> GetActiveAnnouncements()
        {
            var now = DateTime.UtcNow;
            
            // Build a list of all audiences this user belongs to
            var audiences = new List<AnnouncementTarget> { AnnouncementTarget.All };
            
            // Check roles using claims directly in case IsInRole fails due to claim mapping issues
            var userRoles = User.Claims
                .Where(c => c.Type == ClaimTypes.Role || c.Type == "role")
                .Select(c => c.Value)
                .ToList();

            if (User.IsInRole("Customer") || userRoles.Contains("Customer")) audiences.Add(AnnouncementTarget.Customer);
            if (User.IsInRole("Merchant") || userRoles.Contains("Merchant")) audiences.Add(AnnouncementTarget.Merchant);
            // Admins can see everything (Merchant + Customer + All) for monitoring
            if (User.IsInRole("Admin") || userRoles.Contains("Admin")) 
            {
                if (!audiences.Contains(AnnouncementTarget.Customer)) audiences.Add(AnnouncementTarget.Customer);
                if (!audiences.Contains(AnnouncementTarget.Merchant)) audiences.Add(AnnouncementTarget.Merchant);
            }

            return await _context.Announcements
                .AsNoTracking()
                .Where(a => a.IsActive && 
                           (!a.ExpiresAt.HasValue || a.ExpiresAt > now) &&
                           audiences.Contains(a.TargetAudience))
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }
    }
}
