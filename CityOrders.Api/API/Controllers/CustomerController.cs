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
    public class CustomerController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CustomerController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (idClaim == null) throw new UnauthorizedAccessException();
            return int.Parse(idClaim.Value);
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<CustomerMeDto>> GetMe()
        {
            try
            {
                var userId = GetUserId();
                var user = await _context.Users
                    .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                    .Include(u => u.CustomerProfile)
                    .Include(u => u.MerchantProfile)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null) return Unauthorized();

                var brand = await _context.Brands.AsNoTracking().FirstOrDefaultAsync(b => b.MerchantUserId == userId);

                return new CustomerMeDto
                {
                    UserId = user.Id,
                    Name = user.Name,
                    Email = user.Email,
                    Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList(),
                    HasCustomerProfile = user.CustomerProfile != null,
                    HasMerchantProfile = user.MerchantProfile != null,
                    IsMerchantApproved = user.MerchantProfile?.IsApproved,
                    BrandId = brand?.Id,
                    BrandName = brand?.Name
                };
            }
            catch (UnauthorizedAccessException) { return Unauthorized(); }
        }

        [HttpGet("addresses")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<IEnumerable<AddressDto>>> GetAddresses()
        {
            var userId = GetUserId();
            var addresses = await _context.CustomerAddresses
                .Where(a => a.CustomerUserId == userId)
                .OrderByDescending(a => a.IsDefault)
                .AsNoTracking()
                .ToListAsync();

            return addresses.Select(a => new AddressDto
            {
                Id = a.Id,
                AddressLine = a.AddressLine,
                Notes = a.Notes,
                IsDefault = a.IsDefault,
                Lat = a.Lat,
                Lng = a.Lng
            }).ToList();
        }

        [HttpPost("addresses")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<AddressDto>> CreateAddress([FromBody] CreateAddressDto dto)
        {
            var userId = GetUserId();

            // Ensure Profile Exists
            var profile = await _context.CustomerProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
            if (profile == null)
            {
                profile = new CustomerProfile { UserId = userId, IsActive = true };
                _context.CustomerProfiles.Add(profile);
            }

            // If defaulting, unset others
            if (dto.IsDefault)
            {
                var others = await _context.CustomerAddresses.Where(a => a.CustomerUserId == userId && a.IsDefault).ToListAsync();
                foreach (var o in others) o.IsDefault = false;
            }

            var address = new CustomerAddress
            {
                CustomerUserId = userId,
                AddressLine = dto.AddressLine,
                Notes = dto.Notes,
                IsDefault = dto.IsDefault,
                Lat = dto.Lat,
                Lng = dto.Lng
            };

            _context.CustomerAddresses.Add(address);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAddresses), new { id = address.Id }, new AddressDto
            {
                Id = address.Id,
                AddressLine = address.AddressLine,
                Notes = address.Notes,
                IsDefault = address.IsDefault,
                Lat = address.Lat,
                Lng = address.Lng
            });
        }

        [HttpPut("addresses/{id}")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> UpdateAddress(int id, [FromBody] UpdateAddressDto dto)
        {
            var userId = GetUserId();
            var address = await _context.CustomerAddresses.FirstOrDefaultAsync(a => a.Id == id && a.CustomerUserId == userId);
            
            if (address == null) return NotFound();

            address.AddressLine = dto.AddressLine;
            address.Notes = dto.Notes;
            address.Lat = dto.Lat;
            address.Lng = dto.Lng;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("addresses/{id}")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> DeleteAddress(int id)
        {
            var userId = GetUserId();
            var address = await _context.CustomerAddresses.FirstOrDefaultAsync(a => a.Id == id && a.CustomerUserId == userId);

            if (address == null) return NotFound();

            _context.CustomerAddresses.Remove(address);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("addresses/{id}/default")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> SetDefaultAddress(int id)
        {
            var userId = GetUserId();
            var address = await _context.CustomerAddresses.FirstOrDefaultAsync(a => a.Id == id && a.CustomerUserId == userId);

            if (address == null) return NotFound();

            var others = await _context.CustomerAddresses.Where(a => a.CustomerUserId == userId && a.IsDefault).ToListAsync();
            foreach (var o in others) o.IsDefault = false;

            address.IsDefault = true;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
