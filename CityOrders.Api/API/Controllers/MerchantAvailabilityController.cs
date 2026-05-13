using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CityOrders.Api.API.Controllers
{
    [Route("api/merchant/availability")]
    [ApiController]
    [Authorize(Roles = "Merchant")]
    [Tags("Merchant - Availability")]
    public class MerchantAvailabilityController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MerchantAvailabilityController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null ? int.Parse(claim.Value) : 0;
        }

        [HttpGet]
        public async Task<IActionResult> GetAvailability()
        {
            var userId = GetUserId();
            var profile = await _context.MerchantProfiles
                .AsNoTracking()
                .Include(p => p.Brand)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null) return NotFound("Merchant profile not found.");

            // Check if shift is open
            var isOnShift = profile.Brand != null && await _context.MerchantShifts
                .AnyAsync(s => s.BrandId == profile.Brand.Id && s.Status == ShiftStatus.Open);

            // Check if temporary closed period expired
            var isTemporarilyClosed = profile.IsTemporarilyClosed;
            if (isTemporarilyClosed && profile.TemporaryCloseUntil.HasValue && profile.TemporaryCloseUntil.Value <= DateTime.UtcNow)
            {
                isTemporarilyClosed = false;
            }

            return Ok(new MerchantAvailabilityDto
            {
                IsOnShift = isOnShift, // Use calculated isOnShift
                IsTemporarilyClosed = isOnShift && isTemporarilyClosed, // Force false if shift is closed
                TemporaryCloseReason = isOnShift ? profile.TemporaryCloseReason : null,
                TemporaryCloseUntil = isOnShift ? profile.TemporaryCloseUntil : null
            });
        }

        [HttpPost("temporary-close")]
        public async Task<IActionResult> TemporaryClose([FromBody] TemporaryCloseDto dto)
        {
            var userId = GetUserId();
            var profile = await _context.MerchantProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null) return NotFound("Merchant profile not found.");

            profile.IsTemporarilyClosed = true;
            profile.TemporaryCloseReason = dto.Reason;
            profile.TemporaryCloseUntil = dto.Until;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Merchant is now temporarily closed and hidden from customers." });
        }

        [HttpPost("temporary-open")]
        public async Task<IActionResult> TemporaryOpen()
        {
            var userId = GetUserId();
            var profile = await _context.MerchantProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null) return NotFound("Merchant profile not found.");

            profile.IsTemporarilyClosed = false;
            profile.TemporaryCloseReason = null;
            profile.TemporaryCloseUntil = null;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Merchant is now open and visible to customers." });
        }
    }
}
