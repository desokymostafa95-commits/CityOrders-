using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Application.Services;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CityOrders.Api.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CatalogController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CatalogController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get active categories ordered by SortOrder then Name
        /// </summary>
        [HttpGet("categories")]
        [ProducesResponseType(typeof(object), 200)]
        public async Task<ActionResult<dynamic>> GetCategories()
        {
            var categories = await _context.Categories
                .Where(c => c.IsActive)
                .OrderBy(c => c.SortOrder)
                .ThenBy(c => c.Name)
                .AsNoTracking()
                .Select(c => new CatalogCategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Slug = c.Slug,
                    IconKey = c.IconKey,
                    ImageUrl = c.ImageUrl,
                    SortOrder = c.SortOrder
                })
                .ToListAsync();

            return Ok(new { total = categories.Count, items = categories });
        }

        [HttpGet("brands")]
        public async Task<ActionResult<dynamic>> GetBrands(
            [FromQuery] string? search,
            [FromQuery] string? category,
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 20)
        {
            if (page < 1) page = 1;
            if (pageSize > 100) pageSize = 100;

            // Visibility requires: IsApproved + IsActive + Shift Open
            var query = _context.Brands
                .Include(b => b.MerchantProfile)
                .Include(b => b.MasterCategories)
                .AsNoTracking()
                .Where(b => b.IsActive && 
                            b.MerchantProfile != null && 
                            b.MerchantProfile.IsApproved &&
                            b.MerchantProfile.IsActive &&
                            (!b.MerchantProfile.IsTemporarilyClosed || (b.MerchantProfile.TemporaryCloseUntil.HasValue && b.MerchantProfile.TemporaryCloseUntil.Value <= DateTime.UtcNow)) &&
                            b.MerchantProfile.IsOnShift);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(b => b.Name.Contains(search));

            if (!string.IsNullOrEmpty(category))
                query = query.Where(b => b.MasterCategories.Any(mc => mc.Slug == category || mc.Name == category));

            var total = await query.CountAsync();
            var brands = await query
                .OrderBy(b => b.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new CatalogBrandDto
                {
                    Id = b.Id,
                    Name = b.Name,
                    Address = b.Address,
                    Phone1 = b.Phone1,
                    IsActive = b.IsActive,
                    LogoUrl = b.LogoUrl,
                    CategoryTags = b.MasterCategories.Select(mc => mc.Slug).ToList(),
                    DeliveryPricing = new DeliveryPricingDto
                    {
                        BaseFee = b.BaseDeliveryFee,
                        FeePerMeter = b.FeePerMeter,
                        MinFee = b.MinDeliveryFee,
                        MaxFee = b.MaxDeliveryFee,
                        MaxDistanceMeters = b.MaxDeliveryDistanceMeters
                    }
                })
                .ToListAsync();

            return Ok(new { page, pageSize, total, items = brands });
        }


        [HttpGet("brands/{brandId}")]
        public async Task<ActionResult<CatalogBrandDto>> GetBrand(int brandId)
        {
            var brand = await _context.Brands
                .Include(b => b.MerchantProfile)
                .Include(b => b.MasterCategories)
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == brandId && 
                                          b.IsActive && 
                                          b.MerchantProfile != null && 
                                          b.MerchantProfile.IsApproved &&
                                          b.MerchantProfile.IsActive &&
                                          (!b.MerchantProfile.IsTemporarilyClosed || (b.MerchantProfile.TemporaryCloseUntil.HasValue && b.MerchantProfile.TemporaryCloseUntil.Value <= DateTime.UtcNow)) &&
                                          b.MerchantProfile.IsOnShift);

            if (brand == null) return NotFound();

            return new CatalogBrandDto
            {
                Id = brand.Id,
                Name = brand.Name,
                Address = brand.Address,
                Phone1 = brand.Phone1,
                IsActive = brand.IsActive,
                LogoUrl = brand.LogoUrl,
                CategoryTags = brand.MasterCategories.Select(mc => mc.Slug).ToList(),
                DeliveryPricing = new DeliveryPricingDto
                {
                    BaseFee = brand.BaseDeliveryFee,
                    FeePerMeter = brand.FeePerMeter,
                    MinFee = brand.MinDeliveryFee,
                    MaxFee = brand.MaxDeliveryFee,
                    MaxDistanceMeters = brand.MaxDeliveryDistanceMeters
                }
            };
        }

        [HttpGet("brands/{brandId}/products")]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetBrandProducts(int brandId)
        {
            var brand = await _context.Brands
                .Include(b => b.MerchantProfile)
                .Include(b => b.Products).ThenInclude(p => p.Photos)
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == brandId && 
                                          b.IsActive && 
                                          b.MerchantProfile != null && 
                                          b.MerchantProfile.IsApproved &&
                                          b.MerchantProfile.IsActive &&
                                          (!b.MerchantProfile.IsTemporarilyClosed || (b.MerchantProfile.TemporaryCloseUntil.HasValue && b.MerchantProfile.TemporaryCloseUntil.Value <= DateTime.UtcNow)) &&
                                          b.MerchantProfile.IsOnShift);

            if (brand == null) return NotFound("Brand not found or inactive.");

            return brand.Products.Where(p => p.IsActive).Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                IsActive = p.IsActive,
                PrimaryImageUrl = p.Photos.FirstOrDefault(ph => ph.IsPrimary)?.Url,
                UnitType = p.UnitType,
                QuantityStep = p.QuantityStep,
                AllowFractionalQuantity = p.AllowFractionalQuantity
            }).ToList();
        }

        /// <summary>
        /// Get delivery quote for a specific brand and customer address
        /// </summary>
        /// <param name="brandId">Brand ID</param>
        /// <param name="addressId">Customer address ID</param>
        /// <returns>Delivery quote with fee, distance, and deliverability</returns>
        [HttpGet("brands/{brandId}/delivery-quote")]
        [Authorize(Roles = "Customer")]
        [ProducesResponseType(typeof(DeliveryQuoteDto), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(401)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<DeliveryQuoteDto>> GetDeliveryQuote(int brandId, [FromQuery] int addressId)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            // Load brand (must be active/approved)
            var brand = await _context.Brands
                .Include(b => b.MerchantProfile)
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == brandId && 
                                          b.IsActive && 
                                          b.MerchantProfile != null && 
                                          b.MerchantProfile.IsApproved);

            if (brand == null)
                return NotFound("Brand not found or not available.");

            // Load customer address (must belong to authenticated customer)
            var address = await _context.CustomerAddresses
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == addressId && a.CustomerUserId == userId);

            if (address == null)
                return NotFound("Address not found.");

            // Validate address coordinates
            if (!address.Lat.HasValue || !address.Lng.HasValue)
                return BadRequest("Address location is missing. Please update the address with coordinates.");

            // Validate brand coordinates
            if (!brand.LocationLat.HasValue || !brand.LocationLng.HasValue)
            {
                return Ok(new DeliveryQuoteDto
                {
                    BrandId = brandId,
                    AddressId = addressId,
                    DistanceMeters = 0,
                    DeliveryFee = 0,
                    IsDeliverable = false,
                    Reason = "Store location not set"
                });
            }

            // Calculate delivery
            var result = DeliveryFeeCalculator.CalculateDelivery(
                brand,
                brand.LocationLat, brand.LocationLng,
                address.Lat, address.Lng);

            return Ok(new DeliveryQuoteDto
            {
                BrandId = brandId,
                AddressId = addressId,
                DistanceMeters = result.DistanceMeters,
                DeliveryFee = result.Fee,
                IsDeliverable = result.IsDeliverable,
                Reason = result.Reason
            });
        }

        [HttpGet("subscribed-brands")]
        public async Task<ActionResult<dynamic>> GetSubscribedBrands(
            [FromQuery] string? search,
            [FromQuery] string? category,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            if (page < 1) page = 1;
            if (pageSize > 100) pageSize = 100;

            // Filter brands that have a merchant profile, are active, 
            // and specifically have a subscription record
            var query = _context.Brands
                .Include(b => b.MerchantProfile)
                .Include(b => b.MasterCategories)
                .AsNoTracking()
                .Where(b => b.IsActive && 
                            b.MerchantProfile != null && 
                            b.MerchantProfile.IsApproved &&
                            b.MerchantProfile.IsActive &&
                            (!b.MerchantProfile.IsTemporarilyClosed || (b.MerchantProfile.TemporaryCloseUntil.HasValue && b.MerchantProfile.TemporaryCloseUntil.Value <= DateTime.UtcNow)) &&
                            b.MerchantProfile.IsOnShift);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(b => b.Name.Contains(search));

            if (!string.IsNullOrEmpty(category))
                query = query.Where(b => b.MasterCategories.Any(mc => mc.Slug == category || mc.Name == category));

            var total = await query.CountAsync();
            var brands = await query
                .OrderBy(b => b.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new CatalogBrandDto
                {
                    Id = b.Id,
                    Name = b.Name,
                    Address = b.Address,
                    Phone1 = b.Phone1,
                    IsActive = b.IsActive,
                    LogoUrl = b.LogoUrl,
                    CategoryTags = b.MasterCategories.Select(mc => mc.Slug).ToList(),
                    DeliveryPricing = new DeliveryPricingDto
                    {
                        BaseFee = b.BaseDeliveryFee,
                        FeePerMeter = b.FeePerMeter,
                        MinFee = b.MinDeliveryFee,
                        MaxFee = b.MaxDeliveryFee,
                        MaxDistanceMeters = b.MaxDeliveryDistanceMeters
                    }
                })
                .ToListAsync();

            return Ok(new { page, pageSize, total, items = brands });
        }

        /// <summary>
        /// Get all currently active offers from visible brands
        /// </summary>
        [HttpGet("offers")]
        [ProducesResponseType(typeof(object), 200)]
        public async Task<ActionResult<dynamic>> GetOffers()
        {
            var now = DateTime.UtcNow;

            var offers = await _context.BrandOffers
                .Include(bo => bo.Product).ThenInclude(p => p.Photos)
                .Include(bo => bo.Brand).ThenInclude(b => b.MerchantProfile)
                .AsNoTracking()
                .Where(bo => bo.IsActive && 
                            bo.StartAt <= now && 
                            bo.EndAt >= now &&
                            bo.Product.IsActive &&
                            bo.Brand.IsActive &&
                            bo.Brand.MerchantProfile != null &&
                            bo.Brand.MerchantProfile.IsApproved &&
                            bo.Brand.MerchantProfile.IsActive &&
                            (!bo.Brand.MerchantProfile.IsTemporarilyClosed || (bo.Brand.MerchantProfile.TemporaryCloseUntil.HasValue && bo.Brand.MerchantProfile.TemporaryCloseUntil.Value <= now)) &&
                            bo.Brand.MerchantProfile.IsOnShift)
                .OrderBy(bo => bo.Brand.Name)
                .Select(bo => new CatalogOfferDto
                {
                    BrandId = bo.BrandId,
                    BrandName = bo.Brand.Name,
                    BrandLogoUrl = bo.Brand.LogoUrl,
                    ProductId = bo.ProductId,
                    ProductName = bo.Product.Name,
                    ProductImageUrl = bo.Product.Photos.FirstOrDefault(p => p.IsPrimary).Url,
                    OriginalPrice = bo.Product.Price,
                    OfferPrice = bo.OfferPrice,
                    EndAt = bo.EndAt
                })
                .ToListAsync();

            return Ok(new { total = offers.Count, items = offers });
        }

        /// <summary>
        /// Validate a promo code before placing an order (Customer auth required)
        /// </summary>
        [HttpPost("validate-promo")]
        [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Customer")]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> ValidatePromo([FromBody] ValidatePromoDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var now = DateTime.UtcNow;
            var code = dto.Code?.Trim().ToUpperInvariant();

            if (string.IsNullOrEmpty(code))
                return BadRequest("Code is required.");

            var promo = await _context.PromoCodes
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.BrandId == dto.BrandId && p.Code == code);

            if (promo == null)
                return Ok(new { valid = false, message = "Promo code not found." });
            if (!promo.IsActive)
                return Ok(new { valid = false, message = "This promo code is inactive." });
            if (promo.StartsAt.HasValue && promo.StartsAt > now)
                return Ok(new { valid = false, message = "This promo code hasn't started yet." });
            if (promo.ExpiresAt.HasValue && promo.ExpiresAt < now)
                return Ok(new { valid = false, message = "This promo code has expired." });
            if (promo.UsageLimit.HasValue && promo.UsageCount >= promo.UsageLimit)
                return Ok(new { valid = false, message = "This promo code has reached its usage limit." });
            if (promo.MinOrderAmount.HasValue && dto.Subtotal < promo.MinOrderAmount)
                return Ok(new { valid = false, message = $"Minimum order of {promo.MinOrderAmount:F2} EGP required." });

            var alreadyUsed = await _context.PromoCodeUsages
                .AnyAsync(u => u.PromoCodeId == promo.Id && u.CustomerUserId == userId);
            if (alreadyUsed)
                return Ok(new { valid = false, message = "You have already used this promo code." });

            // Calculate discount
            decimal discount = promo.DiscountType == "Percentage"
                ? dto.Subtotal * (promo.DiscountValue / 100m)
                : promo.DiscountValue;

            if (promo.MaxDiscountAmount.HasValue && discount > promo.MaxDiscountAmount)
                discount = promo.MaxDiscountAmount.Value;

            if (discount > dto.Subtotal) discount = dto.Subtotal;
            discount = Math.Round(discount, 2);

            return Ok(new
            {
                valid = true,
                discountType = promo.DiscountType,
                discountValue = promo.DiscountValue,
                discountAmount = discount,
                maxDiscountAmount = promo.MaxDiscountAmount,
                message = promo.DiscountType == "Percentage"
                    ? $"{promo.DiscountValue}% off — you save {discount:F2} EGP!"
                    : $"{discount:F2} EGP off!"
            });
        }

        private int? GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (idClaim == null) return null;
            return int.Parse(idClaim.Value);
        }
    }

    public class ValidatePromoDto
    {
        public int BrandId { get; set; }
        public string Code { get; set; } = string.Empty;
        public decimal Subtotal { get; set; }
    }
}

