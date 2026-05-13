using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityOrders.Api.API.Controllers
{
    [Route("api/admin/settings")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    [Tags("Admin - Settings")]
    public class AdminSettingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminSettingsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _context.AppSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                // Init if missing
                settings = new AppSettings();
                _context.AppSettings.Add(settings);
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                isFreeTrialEnabled = settings.IsFreeTrialEnabled,
                freeTrialDays = settings.FreeTrialDays,
                trialGraceDays = settings.TrialGraceDays,
                trialMaxConcurrentOffers = settings.TrialMaxConcurrentOffers
            });
        }

        [HttpPut]
        public async Task<IActionResult> UpdateSettings([FromBody] UpdateSettingsDto dto)
        {
            if (dto.FreeTrialDays < 0 || dto.FreeTrialDays > 90) return BadRequest("FreeTrialDays must be between 0 and 90.");
            if (dto.TrialGraceDays < 0 || dto.TrialGraceDays > 30) return BadRequest("TrialGraceDays must be between 0 and 30.");
            if (dto.TrialMaxConcurrentOffers < 0 || dto.TrialMaxConcurrentOffers > 50) return BadRequest("TrialMaxConcurrentOffers must be between 0 and 50.");

            var settings = await _context.AppSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new AppSettings();
                _context.AppSettings.Add(settings);
            }

            settings.IsFreeTrialEnabled = dto.IsFreeTrialEnabled;
            settings.FreeTrialDays = dto.FreeTrialDays;
            settings.TrialGraceDays = dto.TrialGraceDays;
            settings.TrialMaxConcurrentOffers = dto.TrialMaxConcurrentOffers;
            settings.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log Action
            _context.AuditLogs.Add(new AuditLog
            {
                Action = "SettingsChanged",
                Target = "Application Settings",
                Summary = $"Settings updated. FreeTrial: {dto.IsFreeTrialEnabled} ({dto.FreeTrialDays} days), Grace: {dto.TrialGraceDays} days, MaxOffers: {dto.TrialMaxConcurrentOffers}.",
                AdminName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "Unknown",
                AdminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "Unknown"
            });
            await _context.SaveChangesAsync();

            return Ok(new
            {
                isFreeTrialEnabled = settings.IsFreeTrialEnabled,
                freeTrialDays = settings.FreeTrialDays,
                trialGraceDays = settings.TrialGraceDays,
                trialMaxConcurrentOffers = settings.TrialMaxConcurrentOffers
            });
        }
    }

    public class UpdateSettingsDto
    {
        public bool IsFreeTrialEnabled { get; set; }
        public int FreeTrialDays { get; set; }
        public int TrialGraceDays { get; set; }
        public int TrialMaxConcurrentOffers { get; set; }
    }
}
