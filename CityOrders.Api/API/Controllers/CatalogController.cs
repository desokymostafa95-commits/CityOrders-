using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Application.Services;
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
    public class CatalogController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CatalogController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get active commerce sectors ordered by SortOrder then Name.
        /// </summary>
        [HttpGet("sectors")]
        [ProducesResponseType(typeof(object), 200)]
        public async Task<ActionResult<dynamic>> GetSectors()
        {
            var visibleBrandQuery = _context.Brands
                .AsNoTracking()
                .Where(b => b.IsActive &&
                            b.MerchantProfile != null &&
                            b.MerchantProfile.IsApproved &&
                            b.MerchantProfile.IsActive &&
                            (!b.MerchantProfile.IsTemporarilyClosed || (b.MerchantProfile.TemporaryCloseUntil.HasValue && b.MerchantProfile.TemporaryCloseUntil.Value <= DateTime.UtcNow)) &&
                            b.MerchantProfile.IsOnShift);

            var sectors = await _context.MarketSectors
                .Where(s => s.IsActive)
                .OrderBy(s => s.SortOrder)
                .ThenBy(s => s.Name)
                .AsNoTracking()
                .Select(s => new CatalogMarketSectorDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Slug = s.Slug,
                    Description = s.Description,
                    IconKey = s.IconKey,
                    ImageUrl = s.ImageUrl,
                    SortOrder = s.SortOrder,
                    CategoriesCount = s.Categories.Count(c => c.IsActive),
                    BrandsCount = visibleBrandQuery.Count(b => b.MarketSectorId == s.Id)
                })
                .ToListAsync();

            return Ok(new { total = sectors.Count, items = sectors });
        }

        /// <summary>
        /// Get active categories ordered by SortOrder then Name
        /// </summary>
        [HttpGet("categories")]
        [ProducesResponseType(typeof(object), 200)]
        public async Task<ActionResult<dynamic>> GetCategories([FromQuery] string? sector = null, [FromQuery] int? marketSectorId = null)
        {
            var query = _context.Categories
                .Include(c => c.MarketSector)
                .Where(c => c.IsActive && c.MarketSector.IsActive);

            if (marketSectorId.HasValue)
                query = query.Where(c => c.MarketSectorId == marketSectorId.Value);

            if (!string.IsNullOrWhiteSpace(sector))
                query = query.Where(c => c.MarketSector.Slug == sector || c.MarketSector.Name == sector);

            var categories = await query
                .OrderBy(c => c.SortOrder)
                .ThenBy(c => c.Name)
                .AsNoTracking()
                .Select(c => new CatalogCategoryDto
                {
                    Id = c.Id,
                    MarketSectorId = c.MarketSectorId,
                    MarketSectorName = c.MarketSector.Name,
                    MarketSectorSlug = c.MarketSector.Slug,
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
            [FromQuery] string? sector,
            [FromQuery] string? sort,
            [FromQuery] decimal? lat,
            [FromQuery] decimal? lng,
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 20)
        {
            if (page < 1) page = 1;
            if (pageSize > 100) pageSize = 100;

            // Visibility requires: IsApproved + IsActive + Shift Open
            var query = _context.Brands
                .Include(b => b.MerchantProfile)
                .Include(b => b.MarketSector)
                .Include(b => b.MasterCategories)
                .AsNoTracking()
                .Where(b => b.IsActive && 
                            b.MarketSector.IsActive &&
                            b.MerchantProfile != null && 
                            b.MerchantProfile.IsApproved &&
                            b.MerchantProfile.IsActive &&
                            (!b.MerchantProfile.IsTemporarilyClosed || (b.MerchantProfile.TemporaryCloseUntil.HasValue && b.MerchantProfile.TemporaryCloseUntil.Value <= DateTime.UtcNow)) &&
                            b.MerchantProfile.IsOnShift);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(b => b.Name.Contains(search));

            if (!string.IsNullOrEmpty(category))
                query = query.Where(b => b.MasterCategories.Any(mc => mc.Slug == category || mc.Name == category));

            if (!string.IsNullOrEmpty(sector))
                query = query.Where(b => b.MarketSector.Slug == sector || b.MarketSector.Name == sector);

            var isGeoSort = sort?.ToLowerInvariant() == "nearest" || sort?.ToLowerInvariant() == "delivery" || sort?.ToLowerInvariant() == "deliveryfee";

            int total = 0;
            List<Brand> brandEntities;

            if (!isGeoSort)
            {
                total = await query.CountAsync();
                brandEntities = await query
                    .OrderBy(b => b.Name)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();
            }
            else
            {
                brandEntities = await query
                    .OrderBy(b => b.Name)
                    .ToListAsync();
            }

            var brandIds = brandEntities.Select(b => b.Id).ToList();
            var ratingStats = await _context.BrandReviews
                .Where(r => brandIds.Contains(r.BrandId))
                .GroupBy(r => r.BrandId)
                .Select(g => new
                {
                    BrandId = g.Key,
                    Average = g.Average(r => r.Rating),
                    Count = g.Count()
                })
                .ToDictionaryAsync(x => x.BrandId);

            var hasCustomerLocation = lat.HasValue && lng.HasValue;
            var brands = brandEntities
                .Select(b =>
                {
                    ratingStats.TryGetValue(b.Id, out var rating);
                    var dto = new CatalogBrandDto
                    {
                        Id = b.Id,
                        Name = b.Name,
                        Address = b.Address,
                        Phone1 = b.Phone1,
                        IsActive = b.IsActive,
                        LogoUrl = b.LogoUrl,
                        MarketSectorId = b.MarketSectorId,
                        MarketSectorName = b.MarketSector.Name,
                        MarketSectorSlug = b.MarketSector.Slug,
                        CategoryTags = b.MasterCategories.Select(mc => mc.Slug).ToList(),
                        AverageRating = rating?.Average,
                        ReviewsCount = rating?.Count ?? 0,
                        DeliveryPricing = new DeliveryPricingDto
                        {
                            BaseFee = b.BaseDeliveryFee,
                            FeePerMeter = b.FeePerMeter,
                            MinFee = b.MinDeliveryFee,
                            MaxFee = b.MaxDeliveryFee,
                            MaxDistanceMeters = b.MaxDeliveryDistanceMeters
                        }
                    };

                    if (hasCustomerLocation)
                    {
                        var delivery = DeliveryFeeCalculator.CalculateDelivery(
                            b,
                            b.LocationLat,
                            b.LocationLng,
                            lat,
                            lng);

                        dto.DistanceMeters = delivery.DistanceMeters;
                        dto.EstimatedDeliveryFee = delivery.IsDeliverable ? delivery.Fee : null;
                    }

                    return dto;
                })
                .ToList();

            if (isGeoSort)
            {
                brands = (sort?.ToLowerInvariant()) switch
                {
                    "nearest" => brands
                        .OrderBy(b => b.DistanceMeters ?? int.MaxValue)
                        .ThenBy(b => b.Name)
                        .ToList(),
                    "delivery" or "deliveryfee" => brands
                        .OrderBy(b => b.EstimatedDeliveryFee ?? decimal.MaxValue)
                        .ThenBy(b => b.Name)
                        .ToList(),
                    _ => brands.OrderBy(b => b.Name).ToList()
                };

                total = brands.Count;
                brands = brands
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();
            }

            return Ok(new { page, pageSize, total, items = brands });
        }


        [HttpGet("brands/{brandId}")]
        public async Task<ActionResult<CatalogBrandDto>> GetBrand(int brandId, [FromQuery] decimal? lat, [FromQuery] decimal? lng)
        {
            var brand = await _context.Brands
                .Include(b => b.MerchantProfile)
                .Include(b => b.MarketSector)
                .Include(b => b.MasterCategories)
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == brandId && 
                                          b.IsActive && 
                                          b.MarketSector.IsActive &&
                                          b.MerchantProfile != null && 
                                          b.MerchantProfile.IsApproved &&
                                          b.MerchantProfile.IsActive &&
                                          (!b.MerchantProfile.IsTemporarilyClosed || (b.MerchantProfile.TemporaryCloseUntil.HasValue && b.MerchantProfile.TemporaryCloseUntil.Value <= DateTime.UtcNow)) &&
                                          b.MerchantProfile.IsOnShift);

            if (brand == null) return NotFound();

            var rating = await _context.BrandReviews
                .Where(r => r.BrandId == brandId)
                .GroupBy(r => r.BrandId)
                .Select(g => new
                {
                    Average = g.Average(r => r.Rating),
                    Count = g.Count()
                })
                .FirstOrDefaultAsync();

            var dto = new CatalogBrandDto
            {
                Id = brand.Id,
                Name = brand.Name,
                Address = brand.Address,
                Phone1 = brand.Phone1,
                IsActive = brand.IsActive,
                LogoUrl = brand.LogoUrl,
                MarketSectorId = brand.MarketSectorId,
                MarketSectorName = brand.MarketSector.Name,
                MarketSectorSlug = brand.MarketSector.Slug,
                CategoryTags = brand.MasterCategories.Select(mc => mc.Slug).ToList(),
                AverageRating = rating?.Average,
                ReviewsCount = rating?.Count ?? 0,
                DeliveryPricing = new DeliveryPricingDto
                {
                    BaseFee = brand.BaseDeliveryFee,
                    FeePerMeter = brand.FeePerMeter,
                    MinFee = brand.MinDeliveryFee,
                    MaxFee = brand.MaxDeliveryFee,
                    MaxDistanceMeters = brand.MaxDeliveryDistanceMeters
                }
            };

            if (lat.HasValue && lng.HasValue)
            {
                var delivery = DeliveryFeeCalculator.CalculateDelivery(
                    brand,
                    brand.LocationLat,
                    brand.LocationLng,
                    lat,
                    lng);

                dto.DistanceMeters = delivery.DistanceMeters;
                dto.EstimatedDeliveryFee = delivery.IsDeliverable ? delivery.Fee : null;
            }

            return dto;
        }

        [HttpGet("brands/{brandId}/reviews")]
        public async Task<ActionResult<IEnumerable<CatalogBrandReviewDto>>> GetBrandReviews(int brandId, [FromQuery] int take = 10)
        {
            if (take < 1) take = 10;
            if (take > 50) take = 50;

            var brandExists = await _context.Brands
                .AsNoTracking()
                .AnyAsync(b => b.Id == brandId && b.IsActive);

            if (!brandExists) return NotFound();

            var reviews = await _context.BrandReviews
                .Include(r => r.Customer)
                .Where(r => r.BrandId == brandId)
                .OrderByDescending(r => r.CreatedAt)
                .Take(take)
                .AsNoTracking()
                .Select(r => new CatalogBrandReviewDto
                {
                    Id = r.Id,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CustomerName = r.Customer.Name,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return Ok(reviews);
        }

        [HttpGet("brands/{brandId}/products")]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetBrandProducts(
            int brandId,
            [FromQuery] string? search,
            [FromQuery] string? sort)
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

            var products = brand.Products.Where(p => p.IsActive && !p.IsDeleted);

            if (!string.IsNullOrWhiteSpace(search))
            {
                products = products.Where(p =>
                    p.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    (p.Description != null && p.Description.Contains(search, StringComparison.OrdinalIgnoreCase)));
            }

            products = (sort?.ToLowerInvariant()) switch
            {
                "price-asc" => products.OrderBy(p => p.Price).ThenBy(p => p.Name),
                "price-desc" => products.OrderByDescending(p => p.Price).ThenBy(p => p.Name),
                _ => products.OrderBy(p => p.Name)
            };

            return products.Select(p => new ProductDto
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
            [FromQuery] string? sector,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            if (page < 1) page = 1;
            if (pageSize > 100) pageSize = 100;

            // Filter brands that have a merchant profile, are active, 
            // and specifically have a subscription record
            var query = _context.Brands
                .Include(b => b.MerchantProfile)
                .Include(b => b.MarketSector)
                .Include(b => b.MasterCategories)
                .AsNoTracking()
                .Where(b => b.IsActive && 
                            b.MarketSector.IsActive &&
                            b.MerchantProfile != null && 
                            b.MerchantProfile.IsApproved &&
                            b.MerchantProfile.IsActive &&
                            (!b.MerchantProfile.IsTemporarilyClosed || (b.MerchantProfile.TemporaryCloseUntil.HasValue && b.MerchantProfile.TemporaryCloseUntil.Value <= DateTime.UtcNow)) &&
                            b.MerchantProfile.IsOnShift);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(b => b.Name.Contains(search));

            if (!string.IsNullOrEmpty(category))
                query = query.Where(b => b.MasterCategories.Any(mc => mc.Slug == category || mc.Name == category));

            if (!string.IsNullOrEmpty(sector))
                query = query.Where(b => b.MarketSector.Slug == sector || b.MarketSector.Name == sector);

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
                    MarketSectorId = b.MarketSectorId,
                    MarketSectorName = b.MarketSector.Name,
                    MarketSectorSlug = b.MarketSector.Slug,
                    CategoryTags = b.MasterCategories.Select(mc => mc.Slug).ToList(),
                    AverageRating = _context.BrandReviews
                        .Where(r => r.BrandId == b.Id)
                        .Average(r => (double?)r.Rating),
                    ReviewsCount = _context.BrandReviews.Count(r => r.BrandId == b.Id),
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
                    ProductImageUrl = bo.Product.Photos
                        .Where(p => p.IsPrimary)
                        .Select(p => p.Url)
                        .FirstOrDefault(),
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
                return BadRequest("كود الخصم مطلوب.");

            var promo = await _context.PromoCodes
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.BrandId == dto.BrandId && p.Code == code);

            if (promo == null)
                return Ok(new { valid = false, message = "كود الخصم غير موجود." });
            if (!promo.IsActive)
                return Ok(new { valid = false, message = "كود الخصم غير مفعل حاليا." });
            if (promo.StartsAt.HasValue && promo.StartsAt > now)
                return Ok(new { valid = false, message = "كود الخصم لم يبدأ بعد." });
            if (promo.ExpiresAt.HasValue && promo.ExpiresAt < now)
                return Ok(new { valid = false, message = "انتهت صلاحية كود الخصم." });
            if (promo.UsageLimit.HasValue && promo.UsageCount >= promo.UsageLimit)
                return Ok(new { valid = false, message = "تم الوصول للحد الأقصى لاستخدام هذا الكود." });
            if (promo.MinOrderAmount.HasValue && dto.Subtotal < promo.MinOrderAmount)
                return Ok(new { valid = false, message = $"الحد الأدنى للطلب لاستخدام الكود هو {promo.MinOrderAmount:F2} جنيه." });

            var alreadyUsed = await _context.PromoCodeUsages
                .AnyAsync(u => u.PromoCodeId == promo.Id && u.CustomerUserId == userId);
            if (alreadyUsed)
                return Ok(new { valid = false, message = "استخدمت هذا الكود من قبل." });

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
                    ? $"خصم {promo.DiscountValue}%، وفرت {discount:F2} جنيه."
                    : $"خصم {discount:F2} جنيه."
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
