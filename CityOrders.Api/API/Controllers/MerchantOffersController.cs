using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CityOrders.Api.API.Controllers
{
    [Route("api/merchant/offers")]
    [ApiController]
    [Authorize(Roles = "Merchant")]
    public class MerchantOffersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MerchantOffersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MerchantOfferDto>>> GetOffers()
        {
            var brandId = await GetBrandId();
            if (brandId == null) return BadRequest("Merchant brand not found.");

            var now = DateTime.UtcNow;
            var offers = await _context.BrandOffers
                .Include(bo => bo.Product).ThenInclude(p => p.Photos)
                .Where(bo => bo.BrandId == brandId)
                .OrderByDescending(bo => bo.StartAt)
                .AsNoTracking()
                .ToListAsync();

            return offers.Select(bo => MapToDto(bo, now)).ToList();
        }

        [HttpGet("current")]
        public async Task<ActionResult<MerchantOfferDto?>> GetCurrentOffer()
        {
            var brandId = await GetBrandId();
            if (brandId == null) return BadRequest("Merchant brand not found.");

            var now = DateTime.UtcNow;
            var offer = await _context.BrandOffers
                .Include(bo => bo.Product).ThenInclude(p => p.Photos)
                .Where(bo => bo.BrandId == brandId && bo.IsActive && bo.StartAt <= now && bo.EndAt >= now)
                .AsNoTracking()
                .FirstOrDefaultAsync();

            if (offer == null) return Ok(null);

            return MapToDto(offer, now);
        }

        [HttpGet("limit")]
        public async Task<ActionResult<OfferLimitDto>> GetOfferLimit()
        {
            var brandId = await GetBrandId();
            if (brandId == null) return BadRequest("Merchant brand not found.");

            var userId = await GetUserIdFromBrand(brandId.Value);
            var limit = await GetMaxConcurrentOffers(userId);

            var now = DateTime.UtcNow;
            var used = await _context.BrandOffers.CountAsync(o => 
                o.BrandId == brandId && 
                o.IsActive && 
                o.EndAt > now);

            return new OfferLimitDto
            {
                MaxConcurrentOffers = limit,
                UsedConcurrentOffers = used,
                Remaining = Math.Max(0, limit - used)
            };
        }

        [HttpPost]
        public async Task<ActionResult<MerchantOfferDto>> CreateOffer([FromBody] CreateOfferDto dto)
        {
            var brandId = await GetBrandId();
            if (brandId == null) return BadRequest("Merchant brand not found.");

            if (dto.EndAt <= dto.StartAt)
                return BadRequest("End time must be after start time.");

            // Verify product belongs to brand
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == dto.ProductId && p.BrandId == brandId);
            if (product == null) return BadRequest("Product not found or does not belong to your brand.");

            // Count current concurrent offers
            var now = DateTime.UtcNow;
            var userId = await GetUserIdFromBrand(brandId.Value);
            var maxAllowed = await GetMaxConcurrentOffers(userId);
            
            var count = await _context.BrandOffers.CountAsync(bo => 
                bo.BrandId == brandId && 
                bo.IsActive && 
                bo.EndAt > now);

            if (count >= maxAllowed)
                return Conflict(new { message = $"Offer limit reached for your plan. Max allowed: {maxAllowed}." });

            var offer = new BrandOffer
            {
                BrandId = brandId.Value,
                ProductId = dto.ProductId,
                OfferPrice = dto.OfferPrice,
                StartAt = dto.StartAt.ToUniversalTime(),
                EndAt = dto.EndAt.ToUniversalTime(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.BrandOffers.Add(offer);
            await _context.SaveChangesAsync();

            // Reload for DTO mapping
            await _context.Entry(offer).Reference(bo => bo.Product).LoadAsync();
            await _context.Entry(offer.Product).Collection(p => p.Photos).LoadAsync();

            return CreatedAtAction(nameof(GetOffers), new { id = offer.Id }, MapToDto(offer, DateTime.UtcNow));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<MerchantOfferDto>> UpdateOffer(int id, [FromBody] UpdateOfferDto dto)
        {
            var brandId = await GetBrandId();
            if (brandId == null) return BadRequest("Merchant brand not found.");

            if (dto.EndAt <= dto.StartAt)
                return BadRequest("End time must be after start time.");

            var offer = await _context.BrandOffers.FirstOrDefaultAsync(bo => bo.Id == id && bo.BrandId == brandId);
            if (offer == null) return NotFound();

            // Verify product belongs to brand
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == dto.ProductId && p.BrandId == brandId);
            if (product == null) return BadRequest("Product not found or does not belong to your brand.");

            // check plan limits (excluding self)
            var now = DateTime.UtcNow;
            if (dto.IsActive && dto.EndAt > now)
            {
                var userId = await GetUserIdFromBrand(brandId.Value);
                var maxAllowed = await GetMaxConcurrentOffers(userId);

                var count = await _context.BrandOffers.CountAsync(bo => 
                    bo.BrandId == brandId && 
                    bo.IsActive && 
                    bo.EndAt > now && 
                    bo.Id != id);

                if (count >= maxAllowed)
                    return Conflict(new { message = $"Offer limit reached for your plan. Max allowed: {maxAllowed}." });
            }

            offer.ProductId = dto.ProductId;
            offer.OfferPrice = dto.OfferPrice;
            offer.StartAt = dto.StartAt.ToUniversalTime();
            offer.EndAt = dto.EndAt.ToUniversalTime();
            offer.IsActive = dto.IsActive;
            offer.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Reload for DTO mapping
            await _context.Entry(offer).Reference(bo => bo.Product).LoadAsync();
            await _context.Entry(offer.Product).Collection(p => p.Photos).LoadAsync();

            return MapToDto(offer, DateTime.UtcNow);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DisableOffer(int id)
        {
            var brandId = await GetBrandId();
            if (brandId == null) return BadRequest("Merchant brand not found.");

            var offer = await _context.BrandOffers.FirstOrDefaultAsync(bo => bo.Id == id && bo.BrandId == brandId);
            if (offer == null) return NotFound();

            offer.IsActive = false;
            offer.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        private async Task<int?> GetBrandId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return null;
            var userId = int.Parse(userIdClaim.Value);

            var brand = await _context.Brands.AsNoTracking().FirstOrDefaultAsync(b => b.MerchantUserId == userId);
            return brand?.Id;
        }

        private async Task<int> GetUserIdFromBrand(int brandId)
        {
            var brand = await _context.Brands.AsNoTracking().FirstOrDefaultAsync(b => b.Id == brandId);
            return brand?.MerchantUserId ?? 0;
        }

        private async Task<int> GetMaxConcurrentOffers(int userId)
        {
            var subscription = await _context.MerchantSubscriptions
                .Include(ms => ms.Plan)
                .Where(ms => ms.UserId == userId)
                .OrderByDescending(ms => ms.EndDate)
                .FirstOrDefaultAsync();

            if (subscription == null) return 0; // Default policy: 0 if no subscription

            var state = subscription.GetState();
            if (state == "Expired") return 0;

            // If trial, use global setting
            if (subscription.IsTrial)
            {
                var settings = await _context.AppSettings.AsNoTracking().FirstOrDefaultAsync();
                return settings?.TrialMaxConcurrentOffers ?? 1;
            }

            return subscription.Plan?.MaxConcurrentOffers ?? 0;
        }

        private MerchantOfferDto MapToDto(BrandOffer bo, DateTime now)
        {
            string status = "Expired";
            if (!bo.IsActive) status = "Disabled";
            else if (now < bo.StartAt) status = "Scheduled";
            else if (now >= bo.StartAt && now <= bo.EndAt) status = "Active";

            return new MerchantOfferDto
            {
                Id = bo.Id,
                ProductId = bo.ProductId,
                ProductName = bo.Product.Name,
                ProductImageUrl = bo.Product.Photos.FirstOrDefault(p => p.IsPrimary)?.Url,
                OriginalPrice = bo.Product.Price,
                OfferPrice = bo.OfferPrice,
                StartAt = bo.StartAt,
                EndAt = bo.EndAt,
                IsActive = bo.IsActive,
                Status = status
            };
        }
    }
}
