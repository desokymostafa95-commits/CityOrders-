using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CityOrders.Api.API.Controllers
{
    [Route("api/merchantpromocodes")]
    [ApiController]
    [Authorize(Roles = "Merchant")]
    public class MerchantPromoCodesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MerchantPromoCodesController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (idClaim == null) throw new UnauthorizedAccessException();
            return int.Parse(idClaim.Value);
        }

        private async Task<Brand?> GetOwnBrand(int userId)
            => await _context.Brands.AsNoTracking().FirstOrDefaultAsync(b => b.MerchantUserId == userId);

        // GET /api/merchantpromocodes
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var brand = await GetOwnBrand(GetUserId());
            if (brand == null) return NotFound("Brand not found.");

            var codes = await _context.PromoCodes
                .Where(p => p.BrandId == brand.Id)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new PromoCodeDto(p))
                .ToListAsync();

            return Ok(codes);
        }

        // POST /api/merchantpromocodes
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePromoCodeDto dto)
        {
            var brand = await GetOwnBrand(GetUserId());
            if (brand == null) return NotFound("Brand not found.");

            // Validate
            if (string.IsNullOrWhiteSpace(dto.Code))
                return BadRequest("Code is required.");

            var code = dto.Code.Trim().ToUpperInvariant();

            if (code.Length < 3 || code.Length > 50)
                return BadRequest("Code must be 3–50 characters.");

            if (!System.Text.RegularExpressions.Regex.IsMatch(code, @"^[A-Z0-9_\-]+$"))
                return BadRequest("Code can only contain letters, numbers, hyphens and underscores.");

            if (dto.DiscountType != "Percentage" && dto.DiscountType != "Fixed")
                return BadRequest("DiscountType must be 'Percentage' or 'Fixed'.");

            if (dto.DiscountValue <= 0)
                return BadRequest("DiscountValue must be greater than 0.");

            if (dto.DiscountType == "Percentage" && dto.DiscountValue > 100)
                return BadRequest("Percentage discount cannot exceed 100.");

            // Unique check per brand
            var exists = await _context.PromoCodes.AnyAsync(p => p.BrandId == brand.Id && p.Code == code);
            if (exists) return Conflict($"Code '{code}' already exists for your brand.");

            var promo = new PromoCode
            {
                BrandId = brand.Id,
                Code = code,
                DiscountType = dto.DiscountType,
                DiscountValue = dto.DiscountValue,
                MaxDiscountAmount = dto.MaxDiscountAmount,
                MinOrderAmount = dto.MinOrderAmount,
                UsageLimit = dto.UsageLimit,
                IsActive = dto.IsActive ?? true,
                StartsAt = dto.StartsAt,
                ExpiresAt = dto.ExpiresAt,
            };

            _context.PromoCodes.Add(promo);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAll), new PromoCodeDto(promo));
        }

        // PUT /api/merchantpromocodes/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdatePromoCodeDto dto)
        {
            var brand = await GetOwnBrand(GetUserId());
            if (brand == null) return NotFound("Brand not found.");

            var promo = await _context.PromoCodes.FirstOrDefaultAsync(p => p.Id == id && p.BrandId == brand.Id);
            if (promo == null) return NotFound();

            if (dto.DiscountType != "Percentage" && dto.DiscountType != "Fixed")
                return BadRequest("DiscountType must be 'Percentage' or 'Fixed'.");

            if (dto.DiscountValue <= 0)
                return BadRequest("DiscountValue must be greater than 0.");

            if (dto.DiscountType == "Percentage" && dto.DiscountValue > 100)
                return BadRequest("Percentage discount cannot exceed 100.");

            promo.DiscountType = dto.DiscountType;
            promo.DiscountValue = dto.DiscountValue;
            promo.MaxDiscountAmount = dto.MaxDiscountAmount;
            promo.MinOrderAmount = dto.MinOrderAmount;
            promo.UsageLimit = dto.UsageLimit;
            promo.IsActive = dto.IsActive;
            promo.StartsAt = dto.StartsAt;
            promo.ExpiresAt = dto.ExpiresAt;
            promo.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new PromoCodeDto(promo));
        }

        // PATCH /api/merchantpromocodes/{id}/toggle
        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> Toggle(int id)
        {
            var brand = await GetOwnBrand(GetUserId());
            if (brand == null) return NotFound("Brand not found.");

            var promo = await _context.PromoCodes.FirstOrDefaultAsync(p => p.Id == id && p.BrandId == brand.Id);
            if (promo == null) return NotFound();

            promo.IsActive = !promo.IsActive;
            promo.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { isActive = promo.IsActive });
        }

        // DELETE /api/merchantpromocodes/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var brand = await GetOwnBrand(GetUserId());
            if (brand == null) return NotFound("Brand not found.");

            var promo = await _context.PromoCodes.FirstOrDefaultAsync(p => p.Id == id && p.BrandId == brand.Id);
            if (promo == null) return NotFound();

            if (promo.UsageCount > 0)
                return BadRequest("Cannot delete a promo code that has been used. Disable it instead.");

            _context.PromoCodes.Remove(promo);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    // ─── DTOs ────────────────────────────────────────────────────────────────────

    public record PromoCodeDto
    {
        public int Id { get; init; }
        public string Code { get; init; }
        public string DiscountType { get; init; }
        public decimal DiscountValue { get; init; }
        public decimal? MaxDiscountAmount { get; init; }
        public decimal? MinOrderAmount { get; init; }
        public int? UsageLimit { get; init; }
        public int UsageCount { get; init; }
        public bool IsActive { get; init; }
        public DateTime? StartsAt { get; init; }
        public DateTime? ExpiresAt { get; init; }
        public DateTime CreatedAt { get; init; }
        public string Status { get; init; }

        public PromoCodeDto(PromoCode p)
        {
            var now = DateTime.UtcNow;
            Id = p.Id;
            Code = p.Code;
            DiscountType = p.DiscountType;
            DiscountValue = p.DiscountValue;
            MaxDiscountAmount = p.MaxDiscountAmount;
            MinOrderAmount = p.MinOrderAmount;
            UsageLimit = p.UsageLimit;
            UsageCount = p.UsageCount;
            IsActive = p.IsActive;
            StartsAt = p.StartsAt;
            ExpiresAt = p.ExpiresAt;
            CreatedAt = p.CreatedAt;
            Status = !p.IsActive ? "Disabled"
                   : p.ExpiresAt.HasValue && p.ExpiresAt < now ? "Expired"
                   : p.StartsAt.HasValue && p.StartsAt > now ? "Scheduled"
                   : p.UsageLimit.HasValue && p.UsageCount >= p.UsageLimit ? "Used Up"
                   : "Active";
        }
    }

    public class CreatePromoCodeDto
    {
        public string Code { get; set; } = string.Empty;
        public string DiscountType { get; set; } = "Percentage";
        public decimal DiscountValue { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public decimal? MinOrderAmount { get; set; }
        public int? UsageLimit { get; set; }
        public bool? IsActive { get; set; }
        public DateTime? StartsAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }

    public class UpdatePromoCodeDto
    {
        public string DiscountType { get; set; } = "Percentage";
        public decimal DiscountValue { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public decimal? MinOrderAmount { get; set; }
        public int? UsageLimit { get; set; }
        public bool IsActive { get; set; }
        public DateTime? StartsAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }
}
