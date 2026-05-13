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
    [Authorize(Roles = "Customer")]
    public class OrderController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public OrderController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        private int GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (idClaim == null) throw new UnauthorizedAccessException();
            return int.Parse(idClaim.Value);
        }

        [HttpPost]
        [ProducesResponseType(200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(typeof(ProblemDetails), 422)]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto)
        {
            var userId = GetUserId();

            // 1. Validate Items
            if (dto.Items == null || !dto.Items.Any()) return BadRequest("Order must have items.");
            if (dto.Items.Any(i => i.Quantity <= 0)) return BadRequest("Quantity must be > 0.");

            // 2. Validate Profile
            var customerProfile = await _context.CustomerProfiles.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customerProfile == null) return BadRequest("Customer profile not found.");

            // 3. Validate Brand & Merchant Approval
            var brand = await _context.Brands
                .Include(b => b.MerchantProfile)
                .FirstOrDefaultAsync(b => b.Id == dto.BrandId);

            if (brand == null || !brand.IsActive) return BadRequest("Brand not valid or inactive.");
            if (brand.MerchantProfile == null || !brand.MerchantProfile.IsApproved) return BadRequest("Brand is not currently accepting orders.");
            if (!brand.MerchantProfile.IsActive) return BadRequest("Merchant is currently unavailable. Please try again later.");

            var hasSubscription = await _context.MerchantSubscriptions.AnyAsync(ms => ms.UserId == brand.MerchantUserId);
            if (!hasSubscription) return BadRequest("Brand is currently not accepting orders due to subscription status.");

            // 4. Validate Address (must belong to customer)
            var address = await _context.CustomerAddresses.FirstOrDefaultAsync(a => a.Id == dto.DeliveryAddressId && a.CustomerUserId == userId);
            if (address == null) return BadRequest("Invalid delivery address.");

            // 5. Calculate delivery fee based on distance
            var deliveryResult = DeliveryFeeCalculator.CalculateDelivery(
                brand,
                brand.LocationLat, brand.LocationLng,
                address.Lat, address.Lng);

            if (!deliveryResult.IsDeliverable)
            {
                return Problem(
                    detail: deliveryResult.Reason ?? "Delivery not available.",
                    title: "Delivery Not Available",
                    statusCode: 422);
            }

            // 6. Load Products (Optimized)
            var distinctProductIds = dto.Items.Select(i => i.ProductId).Distinct().ToList();
            var products = await _context.Products
                .Where(p => distinctProductIds.Contains(p.Id) && p.BrandId == dto.BrandId && p.IsActive)
                .ToDictionaryAsync(p => p.Id);

            if (products.Count != distinctProductIds.Count)
                return BadRequest("Some products are invalid, inactive, or do not belong to this brand.");

            // 7. Build order items & subtotal
            decimal subtotal = 0;
            var orderItems = new List<OrderItem>();

            var groupedItems = dto.Items.GroupBy(i => i.ProductId)
                .Select(g => new { ProductId = g.Key, Quantity = g.Sum(x => x.Quantity) });

            foreach (var item in groupedItems)
            {
                var product = products[item.ProductId];
                var lineTotal = product.Price * item.Quantity;
                subtotal += lineTotal;

                orderItems.Add(new OrderItem
                {
                    ProductId = product.Id,
                    Quantity = item.Quantity,
                    ProductNameSnapshot = product.Name,
                    UnitPriceSnapshot = product.Price,
                    LineTotal = lineTotal
                });
            }

            // 8. Validate Promo Code (optional)
            PromoCode? appliedPromo = null;
            decimal discountAmount = 0;

            if (!string.IsNullOrWhiteSpace(dto.PromoCode))
            {
                var code = dto.PromoCode.Trim().ToUpperInvariant();
                var now = DateTime.UtcNow;

                appliedPromo = await _context.PromoCodes
                    .FirstOrDefaultAsync(p => p.BrandId == dto.BrandId && p.Code == code);

                if (appliedPromo == null)
                    return BadRequest("Promo code not found.");
                if (!appliedPromo.IsActive)
                    return BadRequest("This promo code is inactive.");
                if (appliedPromo.StartsAt.HasValue && appliedPromo.StartsAt > now)
                    return BadRequest("This promo code hasn't started yet.");
                if (appliedPromo.ExpiresAt.HasValue && appliedPromo.ExpiresAt < now)
                    return BadRequest("This promo code has expired.");
                if (appliedPromo.UsageLimit.HasValue && appliedPromo.UsageCount >= appliedPromo.UsageLimit)
                    return BadRequest("This promo code has reached its usage limit.");
                if (appliedPromo.MinOrderAmount.HasValue && subtotal < appliedPromo.MinOrderAmount)
                    return BadRequest($"Minimum order of {appliedPromo.MinOrderAmount:F2} EGP required for this code.");

                // Check if customer already used this code
                var alreadyUsed = await _context.PromoCodeUsages
                    .AnyAsync(u => u.PromoCodeId == appliedPromo.Id && u.CustomerUserId == userId);
                if (alreadyUsed)
                    return BadRequest("You have already used this promo code.");

                // Calculate discount
                discountAmount = appliedPromo.DiscountType == "Percentage"
                    ? subtotal * (appliedPromo.DiscountValue / 100m)
                    : appliedPromo.DiscountValue;

                // Apply cap for percentage codes
                if (appliedPromo.MaxDiscountAmount.HasValue && discountAmount > appliedPromo.MaxDiscountAmount)
                    discountAmount = appliedPromo.MaxDiscountAmount.Value;

                // Discount can't exceed subtotal
                if (discountAmount > subtotal)
                    discountAmount = subtotal;

                discountAmount = Math.Round(discountAmount, 2);
            }

            // 9. Create Order
            var order = new Order
            {
                CustomerUserId = userId,
                BrandId = dto.BrandId,
                DeliveryAddressId = dto.DeliveryAddressId,
                Status = OrderStatus.Pending,
                Notes = dto.Notes,
                OrderNumber = Guid.NewGuid().ToString().Substring(0, 8).ToUpper(),
                DistanceMeters = deliveryResult.DistanceMeters,
                BaseDeliveryFeeSnapshot = brand.BaseDeliveryFee,
                FeePerMeterSnapshot = brand.FeePerMeter,
                MinDeliveryFeeSnapshot = brand.MinDeliveryFee,
                MaxDeliveryFeeSnapshot = brand.MaxDeliveryFee,
                PromoCodeId = appliedPromo?.Id,
                PromoCodeSnapshot = appliedPromo?.Code,
                DiscountAmount = discountAmount,
            };

            order.Subtotal = subtotal;
            order.DeliveryFee = deliveryResult.Fee;
            order.Total = subtotal + order.DeliveryFee - discountAmount;
            order.Items = orderItems;

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // 10. Record promo usage & increment counter
            if (appliedPromo != null)
            {
                _context.PromoCodeUsages.Add(new PromoCodeUsage
                {
                    PromoCodeId = appliedPromo.Id,
                    CustomerUserId = userId,
                    OrderId = order.Id,
                    DiscountApplied = discountAmount,
                });
                appliedPromo.UsageCount++;
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                message = "Order created.",
                orderId = order.Id,
                orderNumber = order.OrderNumber,
                deliveryFeeApplied = order.DeliveryFee,
                distanceMeters = order.DistanceMeters,
                subtotal = order.Subtotal,
                discountAmount = order.DiscountAmount,
                promoCode = order.PromoCodeSnapshot,
                total = order.Total
            });
        }


        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetMyOrders()
        {
            var userId = GetUserId();
            var orders = await _context.Orders
                .Include(o => o.Brand)
                .Include(o => o.Items)
                .Where(o => o.CustomerUserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .AsNoTracking()
                .ToListAsync();

            return orders.Select(o => new OrderDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                Status = o.Status.ToString(),
                Total = o.Total,
                BrandName = o.Brand.Name,
                CreatedAt = o.CreatedAt,
                QuantityItems = o.Items.Sum(i => i.Quantity),
                DeliveryFeeApplied = o.DeliveryFee,
                DistanceMeters = o.DistanceMeters
            }).ToList();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<OrderDetailDto>> GetOrder(int id)
        {
            var userId = GetUserId();
            var order = await _context.Orders
                .Include(o => o.Brand)
                .Include(o => o.Items).ThenInclude(i => i.Product)
                .Include(o => o.DeliveryAddress)
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.Id == id && o.CustomerUserId == userId);

            if (order == null) return NotFound();

            return new OrderDetailDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                Status = order.Status.ToString(),
                Total = order.Total,
                BrandName = order.Brand.Name,
                CreatedAt = order.CreatedAt,
                QuantityItems = order.Items.Sum(i => i.Quantity),
                Notes = order.Notes,
                Subtotal = order.Subtotal,
                DeliveryFee = order.DeliveryFee,
                DeliveryFeeApplied = order.DeliveryFee,
                DiscountAmount = order.DiscountAmount,
                PromoCode = order.PromoCodeSnapshot,
                DistanceMeters = order.DistanceMeters,
                DeliveryAddress = order.DeliveryAddress?.AddressLine ?? "N/A",
                Items = order.Items.Select(i => new OrderItemDto
                {
                     ProductId = i.ProductId,
                     ProductName = i.ProductNameSnapshot,
                     UnitPrice = i.UnitPriceSnapshot,
                     Quantity = i.Quantity,
                     LineTotal = i.LineTotal
                }).ToList()
            };

        }

        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var userId = GetUserId();
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id && o.CustomerUserId == userId);

            if (order == null) return NotFound();

            if (order.Status != OrderStatus.Pending)
                return BadRequest("Only pending orders can be cancelled.");

            order.Status = OrderStatus.Cancelled;
            order.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Order cancelled.", status = order.Status.ToString() });
        }
    }
}
