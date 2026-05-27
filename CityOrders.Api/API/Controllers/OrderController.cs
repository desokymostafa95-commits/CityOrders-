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
        private readonly NotificationService _notificationService;

        public OrderController(AppDbContext context, IConfiguration configuration, NotificationService notificationService)
        {
            _context = context;
            _configuration = configuration;
            _notificationService = notificationService;
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
            if (dto.Items == null || !dto.Items.Any()) return BadRequest("يجب إضافة منتجات للطلب.");
            if (dto.Items.Any(i => i.Quantity <= 0)) return BadRequest("كمية المنتج يجب أن تكون أكبر من صفر.");

            // 2. Validate Profile
            var customerProfile = await _context.CustomerProfiles.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customerProfile == null) return BadRequest("Customer profile not found.");

            // 3. Validate Brand & Merchant Approval
            var brand = await _context.Brands
                .Include(b => b.MerchantProfile)
                .FirstOrDefaultAsync(b => b.Id == dto.BrandId);

            if (brand == null || !brand.IsActive) return BadRequest("المتجر غير متاح حاليا.");
            if (brand.MerchantProfile == null || !brand.MerchantProfile.IsApproved) return BadRequest("المتجر لا يستقبل طلبات حاليا.");
            if (!brand.MerchantProfile.IsActive) return BadRequest("التاجر غير متاح حاليا. حاول مرة أخرى لاحقا.");
            var isTemporarilyClosed = brand.MerchantProfile.IsTemporarilyClosed &&
                (!brand.MerchantProfile.TemporaryCloseUntil.HasValue || brand.MerchantProfile.TemporaryCloseUntil.Value > DateTime.UtcNow);
            if (!brand.MerchantProfile.IsOnShift || isTemporarilyClosed)
                return BadRequest("التاجر غير متاح حاليا. حاول مرة أخرى لاحقا.");

            var hasSubscription = await _context.MerchantSubscriptions.AnyAsync(ms => ms.UserId == brand.MerchantUserId);
            if (!hasSubscription) return BadRequest("المتجر لا يستقبل طلبات حاليا بسبب حالة الاشتراك.");

            // 4. Validate Address (must belong to customer)
            var address = await _context.CustomerAddresses.FirstOrDefaultAsync(a => a.Id == dto.DeliveryAddressId && a.CustomerUserId == userId);
            if (address == null) return BadRequest("عنوان التوصيل غير صحيح.");

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
                return BadRequest("بعض المنتجات غير متاحة أو لا تتبع هذا المتجر.");

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
                    return BadRequest("كود الخصم غير موجود.");
                if (!appliedPromo.IsActive)
                    return BadRequest("كود الخصم غير مفعل حاليا.");
                if (appliedPromo.StartsAt.HasValue && appliedPromo.StartsAt > now)
                    return BadRequest("كود الخصم لم يبدأ بعد.");
                if (appliedPromo.ExpiresAt.HasValue && appliedPromo.ExpiresAt < now)
                    return BadRequest("انتهت صلاحية كود الخصم.");
                if (appliedPromo.UsageLimit.HasValue && appliedPromo.UsageCount >= appliedPromo.UsageLimit)
                    return BadRequest("تم الوصول للحد الأقصى لاستخدام هذا الكود.");
                if (appliedPromo.MinOrderAmount.HasValue && subtotal < appliedPromo.MinOrderAmount)
                    return BadRequest($"الحد الأدنى للطلب لاستخدام الكود هو {appliedPromo.MinOrderAmount:F2} جنيه.");

                // Check if customer already used this code
                var alreadyUsed = await _context.PromoCodeUsages
                    .AnyAsync(u => u.PromoCodeId == appliedPromo.Id && u.CustomerUserId == userId);
                if (alreadyUsed)
                    return BadRequest("استخدمت هذا الكود من قبل.");

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

            await _notificationService.CreateAsync(
                brand.MerchantUserId,
                "طلب جديد",
                $"وصلك طلب جديد رقم {order.OrderNumber}.",
                "NewOrder",
                order.Id);

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

            var review = await _context.BrandReviews
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.OrderId == order.Id && r.CustomerUserId == userId);

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
                }).ToList(),
                Timeline = BuildTimeline(order),
                NextStep = GetNextStep(order.Status),
                CanReview = order.Status == OrderStatus.Delivered && review == null,
                Review = review == null ? null : new BrandReviewDto
                {
                    Id = review.Id,
                    OrderId = review.OrderId,
                    BrandId = review.BrandId,
                    Rating = review.Rating,
                    Comment = review.Comment,
                    CreatedAt = review.CreatedAt
                }
            };

        }

        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var userId = GetUserId();
            var order = await _context.Orders
                .Include(o => o.Brand)
                .FirstOrDefaultAsync(o => o.Id == id && o.CustomerUserId == userId);

            if (order == null) return NotFound();

            if (order.Status != OrderStatus.Pending)
                return BadRequest("Only pending orders can be cancelled.");

            order.Status = OrderStatus.Cancelled;
            order.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await _notificationService.CreateAsync(
                order.Brand.MerchantUserId,
                "تم إلغاء طلب",
                $"العميل ألغى الطلب رقم {order.OrderNumber}.",
                "OrderCancelled",
                order.Id);
            return Ok(new { message = "Order cancelled.", status = order.Status.ToString() });
        }

        [HttpPost("{id}/review")]
        public async Task<IActionResult> ReviewOrder(int id, [FromBody] CreateBrandReviewDto dto)
        {
            var userId = GetUserId();

            if (dto.Rating < 1 || dto.Rating > 5)
                return BadRequest("Rating must be between 1 and 5.");

            var order = await _context.Orders
                .Include(o => o.Brand)
                .FirstOrDefaultAsync(o => o.Id == id && o.CustomerUserId == userId);

            if (order == null) return NotFound();
            if (order.Status != OrderStatus.Delivered)
                return BadRequest("Only delivered orders can be reviewed.");

            var exists = await _context.BrandReviews.AnyAsync(r => r.OrderId == id);
            if (exists) return BadRequest("Order already reviewed.");

            var review = new BrandReview
            {
                OrderId = order.Id,
                BrandId = order.BrandId,
                CustomerUserId = userId,
                Rating = dto.Rating,
                Comment = string.IsNullOrWhiteSpace(dto.Comment) ? null : dto.Comment.Trim()
            };

            _context.BrandReviews.Add(review);
            await _context.SaveChangesAsync();

            await _notificationService.CreateAsync(
                order.Brand.MerchantUserId,
                "تقييم جديد",
                $"وصلك تقييم {review.Rating} من 5 على الطلب رقم {order.OrderNumber}.",
                "NewReview",
                order.Id);

            return Ok(new BrandReviewDto
            {
                Id = review.Id,
                OrderId = review.OrderId,
                BrandId = review.BrandId,
                Rating = review.Rating,
                Comment = review.Comment,
                CreatedAt = review.CreatedAt
            });
        }

        private static List<OrderTimelineItemDto> BuildTimeline(Order order)
        {
            var statusOrder = new[]
            {
                OrderStatus.Pending,
                OrderStatus.Accepted,
                OrderStatus.Preparing,
                OrderStatus.OutForDelivery,
                OrderStatus.Delivered
            };

            var labels = new Dictionary<OrderStatus, (string Label, string Description)>
            {
                [OrderStatus.Pending] = ("تم إرسال الطلب", "الطلب وصل للتاجر وفي انتظار القبول."),
                [OrderStatus.Accepted] = ("تم قبول الطلب", "التاجر قبل الطلب وسيبدأ التحضير."),
                [OrderStatus.Preparing] = ("جاري التحضير", "طلبك يتم تجهيزه الآن."),
                [OrderStatus.OutForDelivery] = ("في الطريق", "الطلب خرج للتوصيل."),
                [OrderStatus.Delivered] = ("تم التسليم", "تم تسليم الطلب بنجاح.")
            };

            if (order.Status == OrderStatus.Cancelled)
            {
                return new List<OrderTimelineItemDto>
                {
                    new()
                    {
                        Key = "Pending",
                        Label = "تم إرسال الطلب",
                        Description = "الطلب تم إنشاؤه.",
                        Completed = true,
                        At = order.CreatedAt
                    },
                    new()
                    {
                        Key = "Cancelled",
                        Label = "تم إلغاء الطلب",
                        Description = "تم إلغاء الطلب.",
                        Completed = true,
                        At = order.UpdatedAt
                    }
                };
            }

            var currentIndex = Array.IndexOf(statusOrder, order.Status);
            if (currentIndex < 0) currentIndex = 0;

            return statusOrder.Select((status, index) =>
            {
                var text = labels[status];
                DateTime? at = null;
                if (status == OrderStatus.Pending) at = order.CreatedAt;
                else if (status == OrderStatus.Delivered) at = order.DeliveredAt ?? order.UpdatedAt;
                else if (index <= currentIndex) at = order.UpdatedAt;

                return new OrderTimelineItemDto
                {
                    Key = status.ToString(),
                    Label = text.Label,
                    Description = text.Description,
                    Completed = index <= currentIndex,
                    At = at
                };
            }).ToList();
        }

        private static string GetNextStep(OrderStatus status) => status switch
        {
            OrderStatus.Pending => "في انتظار قبول التاجر.",
            OrderStatus.Accepted => "الخطوة التالية: يبدأ التاجر التحضير.",
            OrderStatus.Preparing => "الخطوة التالية: خروج الطلب للتوصيل.",
            OrderStatus.OutForDelivery => "الطلب في الطريق إليك.",
            OrderStatus.Delivered => "الطلب مكتمل.",
            OrderStatus.Cancelled => "الطلب ملغي.",
            _ => string.Empty
        };
    }
}
