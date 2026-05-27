using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace CityOrders.Api.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AnalyticsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AnalyticsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("events")]
        [AllowAnonymous]
        public async Task<IActionResult> TrackEvent([FromBody] TrackAnalyticsEventDto dto)
        {
            if (!TryParseEventType(dto.EventType, out var eventType))
                return BadRequest("Invalid analytics event type.");

            var brandExists = await _context.Brands
                .AsNoTracking()
                .AnyAsync(b => b.Id == dto.BrandId && b.IsActive);

            if (!brandExists) return NotFound("Brand not found.");

            if (dto.ProductId.HasValue)
            {
                var productBelongsToBrand = await _context.Products
                    .AsNoTracking()
                    .AnyAsync(p => p.Id == dto.ProductId.Value && p.BrandId == dto.BrandId && !p.IsDeleted);

                if (!productBelongsToBrand)
                    return BadRequest("Product does not belong to this brand.");
            }

            if ((eventType == AnalyticsEventType.ProductView || eventType == AnalyticsEventType.AddToCart) && !dto.ProductId.HasValue)
                return BadRequest("ProductId is required for product analytics events.");

            var searchTerm = NormalizeSearchTerm(dto.SearchTerm);
            if (eventType == AnalyticsEventType.Search && string.IsNullOrWhiteSpace(searchTerm))
                return BadRequest("SearchTerm is required for search analytics events.");

            var customerUserId = GetOptionalUserId();
            var visitorId = TrimToMax(dto.VisitorId, 100);
            var sessionId = TrimToMax(dto.SessionId, 100);

            if (await IsDuplicateEvent(dto.BrandId, dto.ProductId, eventType, customerUserId, visitorId, sessionId, searchTerm))
                return NoContent();

            _context.AnalyticsEvents.Add(new AnalyticsEvent
            {
                BrandId = dto.BrandId,
                ProductId = dto.ProductId,
                CustomerUserId = customerUserId,
                VisitorId = visitorId,
                SessionId = sessionId,
                SearchTerm = searchTerm,
                MetadataJson = TrimToMax(dto.MetadataJson, 1000),
                EventType = eventType
            });

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("merchant/overview")]
        [Authorize(Roles = "Merchant")]
        public async Task<ActionResult<MerchantAnalyticsOverviewDto>> GetMerchantOverview(
            [FromQuery] int days = 30,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null)
        {
            var (fromUtc, toUtc, actualDays) = ResolveRange(days, from, to);
            var merchantUserId = GetRequiredUserId();
            var brand = await _context.Brands
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.MerchantUserId == merchantUserId);

            if (brand == null) return NotFound("Brand not found.");

            var events = await LoadEvents(brand.Id, fromUtc, toUtc);
            var orders = await LoadOrders(brand.Id, fromUtc, toUtc);
            var products = await LoadProducts(brand.Id);
            var reviews = await LoadReviews(brand.Id, fromUtc, toUtc);
            var promoUsages = await LoadPromoUsages(brand.Id, fromUtc, toUtc);

            var previousFrom = fromUtc.AddDays(-actualDays);
            var previousTo = fromUtc;
            var previousEvents = await LoadEvents(brand.Id, previousFrom, previousTo);
            var previousOrders = await LoadOrders(brand.Id, previousFrom, previousTo);

            var overview = BuildMerchantOverview(
                fromUtc,
                toUtc,
                actualDays,
                events,
                orders,
                products,
                reviews,
                promoUsages,
                BuildSnapshot(previousEvents, previousOrders));

            overview.Daily = await SyncDailyAggregatesAsync(brand.Id, fromUtc.Date, toUtc.Date, events, orders);

            return Ok(overview);
        }

        [HttpGet("admin/overview")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<AdminAnalyticsOverviewDto>> GetAdminOverview([FromQuery] int days = 7)
        {
            var (fromUtc, toUtc, _) = ResolveRange(days, null, null);
            var events = await _context.AnalyticsEvents
                .Include(e => e.Brand)
                .Include(e => e.Product)
                .Where(e => e.CreatedAt >= fromUtc && e.CreatedAt <= toUtc)
                .AsNoTracking()
                .ToListAsync();

            var orders = await _context.Orders
                .Include(o => o.Brand)
                .Where(o => o.CreatedAt >= fromUtc && o.CreatedAt <= toUtc && o.Status != OrderStatus.Cancelled)
                .AsNoTracking()
                .ToListAsync();

            var brandIds = events.Select(e => e.BrandId).Concat(orders.Select(o => o.BrandId)).Distinct().ToList();
            var brandRows = await _context.Brands
                .Where(b => brandIds.Contains(b.Id))
                .Select(b => new
                {
                    b.Id,
                    b.Name,
                    b.MarketSectorId,
                    MarketSectorName = b.MarketSector.Name,
                    MarketSectorSlug = b.MarketSector.Slug
                })
                .AsNoTracking()
                .ToListAsync();
            var brands = brandRows.ToDictionary(b => b.Id, b => b.Name);

            var snapshot = BuildSnapshot(events, orders);
            var topMerchants = brandIds
                .Select(brandId =>
                {
                    var brandEvents = events.Where(e => e.BrandId == brandId).ToList();
                    var brandOrders = orders.Where(o => o.BrandId == brandId).ToList();
                    var brandSnapshot = BuildSnapshot(brandEvents, brandOrders);

                    return new AdminMerchantAnalyticsDto
                    {
                        BrandId = brandId,
                        BrandName = brands.TryGetValue(brandId, out var name) ? name : $"Brand #{brandId}",
                        StoreViews = brandSnapshot.StoreViews,
                        ProductViews = brandSnapshot.ProductViews,
                        Orders = brandSnapshot.Orders,
                        Revenue = brandSnapshot.Revenue,
                        ConversionRate = brandSnapshot.ConversionRate
                    };
                })
                .OrderByDescending(m => m.Revenue)
                .ThenByDescending(m => m.ProductViews)
                .Take(8)
                .ToList();

            var sectorBreakdown = brandRows
                .GroupBy(b => new { b.MarketSectorId, b.MarketSectorName, b.MarketSectorSlug })
                .Select(group =>
                {
                    var sectorBrandIds = group.Select(b => b.Id).ToHashSet();
                    var sectorEvents = events.Where(e => sectorBrandIds.Contains(e.BrandId)).ToList();
                    var sectorOrders = orders.Where(o => sectorBrandIds.Contains(o.BrandId)).ToList();
                    var sectorSnapshot = BuildSnapshot(sectorEvents, sectorOrders);

                    return new AdminSectorAnalyticsDto
                    {
                        MarketSectorId = group.Key.MarketSectorId,
                        MarketSectorName = group.Key.MarketSectorName,
                        MarketSectorSlug = group.Key.MarketSectorSlug,
                        StoreViews = sectorSnapshot.StoreViews,
                        ProductViews = sectorSnapshot.ProductViews,
                        Orders = sectorSnapshot.Orders,
                        Revenue = sectorSnapshot.Revenue,
                        ConversionRate = sectorSnapshot.ConversionRate
                    };
                })
                .OrderByDescending(s => s.Revenue)
                .ThenByDescending(s => s.ProductViews)
                .ToList();

            return Ok(new AdminAnalyticsOverviewDto
            {
                From = fromUtc,
                To = toUtc,
                StoreViews = snapshot.StoreViews,
                ProductViews = snapshot.ProductViews,
                AddToCartEvents = snapshot.AddToCartEvents,
                CheckoutStartedEvents = snapshot.CheckoutStartedEvents,
                Searches = snapshot.Searches,
                Orders = snapshot.Orders,
                Revenue = snapshot.Revenue,
                AbandonedCarts = CountAbandonedCarts(events, orders),
                PlatformConversionRate = snapshot.ConversionRate,
                SectorBreakdown = sectorBreakdown,
                TopMerchants = topMerchants,
                SearchTerms = BuildSearchTerms(events, new List<Product>()),
                LiveFeed = BuildLiveFeed(events, orders, new List<BrandReview>())
            });
        }

        private async Task<bool> IsDuplicateEvent(
            int brandId,
            int? productId,
            AnalyticsEventType eventType,
            int? customerUserId,
            string? visitorId,
            string? sessionId,
            string? searchTerm)
        {
            if (eventType != AnalyticsEventType.BrandView &&
                eventType != AnalyticsEventType.ProductView &&
                eventType != AnalyticsEventType.Search)
            {
                return false;
            }

            var since = DateTime.UtcNow.AddMinutes(eventType == AnalyticsEventType.Search ? -15 : -30);
            var query = _context.AnalyticsEvents
                .Where(e => e.BrandId == brandId &&
                            e.EventType == eventType &&
                            e.ProductId == productId &&
                            e.SearchTerm == searchTerm &&
                            e.CreatedAt >= since);

            if (customerUserId.HasValue)
                query = query.Where(e => e.CustomerUserId == customerUserId.Value);
            else if (!string.IsNullOrWhiteSpace(visitorId))
                query = query.Where(e => e.VisitorId == visitorId);
            else if (!string.IsNullOrWhiteSpace(sessionId))
                query = query.Where(e => e.SessionId == sessionId);
            else
                return false;

            return await query.AnyAsync();
        }

        private async Task<List<AnalyticsEvent>> LoadEvents(int brandId, DateTime from, DateTime to)
        {
            return await _context.AnalyticsEvents
                .Include(e => e.Product)
                .Where(e => e.BrandId == brandId && e.CreatedAt >= from && e.CreatedAt <= to)
                .AsNoTracking()
                .ToListAsync();
        }

        private async Task<List<Order>> LoadOrders(int brandId, DateTime from, DateTime to)
        {
            return await _context.Orders
                .Include(o => o.Items)
                .Where(o => o.BrandId == brandId &&
                            o.CreatedAt >= from &&
                            o.CreatedAt <= to &&
                            o.Status != OrderStatus.Cancelled)
                .AsNoTracking()
                .ToListAsync();
        }

        private async Task<List<Product>> LoadProducts(int brandId)
        {
            return await _context.Products
                .Where(p => p.BrandId == brandId && !p.IsDeleted)
                .AsNoTracking()
                .Select(p => new Product { Id = p.Id, Name = p.Name, BrandId = p.BrandId })
                .ToListAsync();
        }

        private async Task<List<BrandReview>> LoadReviews(int brandId, DateTime from, DateTime to)
        {
            return await _context.BrandReviews
                .Where(r => r.BrandId == brandId && r.CreatedAt >= from && r.CreatedAt <= to)
                .AsNoTracking()
                .ToListAsync();
        }

        private async Task<List<PromoCodeUsage>> LoadPromoUsages(int brandId, DateTime from, DateTime to)
        {
            return await _context.PromoCodeUsages
                .Include(u => u.PromoCode)
                .Include(u => u.Order)
                .Where(u => u.PromoCode.BrandId == brandId && u.UsedAt >= from && u.UsedAt <= to)
                .AsNoTracking()
                .ToListAsync();
        }

        private MerchantAnalyticsOverviewDto BuildMerchantOverview(
            DateTime from,
            DateTime to,
            int days,
            List<AnalyticsEvent> events,
            List<Order> orders,
            List<Product> products,
            List<BrandReview> reviews,
            List<PromoCodeUsage> promoUsages,
            AnalyticsSnapshot previous)
        {
            var snapshot = BuildSnapshot(events, orders);
            var productRows = BuildProductAnalytics(products, events, orders);
            var searchTerms = BuildSearchTerms(events, products);
            var abandonedCarts = CountAbandonedCarts(events, orders);
            var reviewsSummary = BuildReviews(reviews);

            return new MerchantAnalyticsOverviewDto
            {
                From = from,
                To = to,
                Days = days,
                StoreViews = snapshot.StoreViews,
                UniqueStoreVisitors = snapshot.UniqueStoreVisitors,
                ProductViews = snapshot.ProductViews,
                UniqueProductViewers = snapshot.UniqueProductViewers,
                AddToCartEvents = snapshot.AddToCartEvents,
                CheckoutStartedEvents = snapshot.CheckoutStartedEvents,
                Searches = snapshot.Searches,
                Orders = snapshot.Orders,
                Revenue = snapshot.Revenue,
                PromoDiscount = orders.Sum(o => o.DiscountAmount),
                AbandonedCarts = abandonedCarts,
                ProductViewersWithoutOrder = CountProductViewersWithoutOrder(events, orders),
                ProductViewToOrderRate = snapshot.ConversionRate,
                StoreToProductRate = Rate(snapshot.UniqueProductViewers, snapshot.UniqueStoreVisitors),
                ProductToCartRate = Rate(UniqueEventKeys(events, AnalyticsEventType.AddToCart), snapshot.UniqueProductViewers),
                CartToCheckoutRate = Rate(UniqueEventKeys(events, AnalyticsEventType.CheckoutStarted), UniqueEventKeys(events, AnalyticsEventType.AddToCart)),
                CheckoutToOrderRate = Rate(snapshot.Orders, UniqueEventKeys(events, AnalyticsEventType.CheckoutStarted)),
                Comparison = new AnalyticsComparisonDto
                {
                    StoreViewsDelta = PercentDelta(snapshot.StoreViews, previous.StoreViews),
                    ProductViewsDelta = PercentDelta(snapshot.ProductViews, previous.ProductViews),
                    OrdersDelta = PercentDelta(snapshot.Orders, previous.Orders),
                    RevenueDelta = PercentDelta(snapshot.Revenue, previous.Revenue),
                    ConversionRateDelta = Math.Round(snapshot.ConversionRate - previous.ConversionRate, 1)
                },
                Funnel = BuildFunnel(snapshot, events),
                Products = productRows,
                OpportunityProducts = productRows
                    .Where(p => p.Views >= 3 && (p.Orders == 0 || p.AbandonedCarts >= 2 || p.ConversionRate < 5))
                    .Take(5)
                    .ToList(),
                SearchTerms = searchTerms,
                Promos = BuildPromos(promoUsages),
                Reviews = reviewsSummary,
                Alerts = BuildAlerts(snapshot, abandonedCarts, productRows, searchTerms, reviewsSummary),
                LiveFeed = BuildLiveFeed(events, orders, reviews)
            };
        }

        private List<ProductAnalyticsDto> BuildProductAnalytics(List<Product> products, List<AnalyticsEvent> events, List<Order> orders)
        {
            var productViewEvents = events.Where(e => e.EventType == AnalyticsEventType.ProductView && e.ProductId.HasValue).ToList();
            var addToCartEvents = events.Where(e => e.EventType == AnalyticsEventType.AddToCart && e.ProductId.HasValue).ToList();

            return products
                .Select(product =>
                {
                    var productViews = productViewEvents.Where(e => e.ProductId == product.Id).ToList();
                    var productAdds = addToCartEvents.Where(e => e.ProductId == product.Id).ToList();
                    var productOrderItems = orders
                        .SelectMany(o => o.Items.Select(i => new { Order = o, Item = i }))
                        .Where(x => x.Item.ProductId == product.Id)
                        .ToList();

                    var viewerKeys = productViews.Select(GetVisitorKey).Where(k => k != null).Cast<string>().Distinct().ToHashSet();
                    var buyerKeys = productOrderItems.Select(x => $"u:{x.Order.CustomerUserId}").Distinct().ToHashSet();
                    var addKeys = productAdds.Select(GetVisitorKey).Where(k => k != null).Cast<string>().Distinct().ToHashSet();
                    var abandoned = addKeys.Except(buyerKeys).Count();
                    var orderCount = productOrderItems.Select(x => x.Order.Id).Distinct().Count();
                    var conversion = viewerKeys.Count == 0 ? 0 : Math.Round((decimal)orderCount / viewerKeys.Count * 100m, 1);

                    return new ProductAnalyticsDto
                    {
                        ProductId = product.Id,
                        ProductName = product.Name,
                        Views = productViews.Count,
                        UniqueViewers = viewerKeys.Count,
                        AddToCartCount = productAdds.Count,
                        Orders = orderCount,
                        QuantitySold = productOrderItems.Sum(x => x.Item.Quantity),
                        ViewersWithoutOrder = viewerKeys.Except(buyerKeys).Count(),
                        AbandonedCarts = abandoned,
                        Revenue = productOrderItems.Sum(x => x.Item.LineTotal),
                        ConversionRate = conversion,
                        Insight = BuildProductInsight(productViews.Count, orderCount, abandoned, conversion)
                    };
                })
                .OrderByDescending(p => p.Views)
                .ThenByDescending(p => p.AbandonedCarts)
                .ThenByDescending(p => p.Orders)
                .Take(12)
                .ToList();
        }

        private static string BuildProductInsight(int views, int orders, int abandoned, decimal conversion)
        {
            if (views >= 5 && orders == 0) return "High interest, no orders";
            if (abandoned >= 3) return "Cart recovery opportunity";
            if (conversion >= 20) return "Strong converter";
            return "Monitor";
        }

        private static List<SearchTermAnalyticsDto> BuildSearchTerms(List<AnalyticsEvent> events, List<Product> products)
        {
            return events
                .Where(e => e.EventType == AnalyticsEventType.Search && !string.IsNullOrWhiteSpace(e.SearchTerm))
                .GroupBy(e => e.SearchTerm!)
                .Select(g =>
                {
                    var term = g.Key;
                    return new SearchTermAnalyticsDto
                    {
                        Term = term,
                        Count = g.Count(),
                        LastSearchedAt = g.Max(e => e.CreatedAt),
                        HasMatchingProduct = products.Count == 0 || products.Any(p => p.Name.Contains(term, StringComparison.OrdinalIgnoreCase))
                    };
                })
                .OrderByDescending(s => s.Count)
                .ThenByDescending(s => s.LastSearchedAt)
                .Take(10)
                .ToList();
        }

        private static ReviewAnalyticsDto BuildReviews(List<BrandReview> reviews)
        {
            var comments = reviews
                .Select(r => r.Comment)
                .Where(c => !string.IsNullOrWhiteSpace(c))
                .Cast<string>()
                .ToList();

            var stopWords = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "the", "and", "for", "with", "this", "that", "very", "good", "bad"
            };

            var keywords = comments
                .SelectMany(c => Regex.Matches(c.ToLowerInvariant(), @"[\p{L}\p{N}]{3,}").Select(m => m.Value))
                .Where(w => !stopWords.Contains(w))
                .GroupBy(w => w)
                .Select(g => new ReviewKeywordDto { Word = g.Key, Count = g.Count() })
                .OrderByDescending(k => k.Count)
                .Take(8)
                .ToList();

            return new ReviewAnalyticsDto
            {
                ReviewsCount = reviews.Count,
                AverageRating = reviews.Count == 0 ? 0 : Math.Round((decimal)reviews.Average(r => r.Rating), 1),
                LowRatingCount = reviews.Count(r => r.Rating <= 2),
                Keywords = keywords,
                Latest = reviews
                    .OrderByDescending(r => r.CreatedAt)
                    .Take(5)
                    .Select(r => new LatestReviewDto
                    {
                        Rating = r.Rating,
                        Comment = r.Comment,
                        CreatedAt = r.CreatedAt
                    })
                    .ToList()
            };
        }

        private static List<PromoAnalyticsDto> BuildPromos(List<PromoCodeUsage> usages)
        {
            return usages
                .GroupBy(u => new { u.PromoCodeId, u.PromoCode.Code, u.PromoCode.IsActive, u.PromoCode.StartsAt, u.PromoCode.ExpiresAt, u.PromoCode.UsageLimit, u.PromoCode.UsageCount })
                .Select(g =>
                {
                    var revenue = g.Sum(u => u.Order.Total);
                    var uses = g.Count();
                    return new PromoAnalyticsDto
                    {
                        PromoCodeId = g.Key.PromoCodeId,
                        Code = g.Key.Code,
                        Uses = uses,
                        Revenue = revenue,
                        DiscountGiven = g.Sum(u => u.DiscountApplied),
                        AverageOrderValue = uses == 0 ? 0 : Math.Round(revenue / uses, 2),
                        Status = GetPromoStatus(g.Key.IsActive, g.Key.StartsAt, g.Key.ExpiresAt, g.Key.UsageLimit, g.Key.UsageCount)
                    };
                })
                .OrderByDescending(p => p.Revenue)
                .Take(8)
                .ToList();
        }

        private static string GetPromoStatus(bool isActive, DateTime? startsAt, DateTime? expiresAt, int? usageLimit, int usageCount)
        {
            var now = DateTime.UtcNow;
            if (!isActive) return "Disabled";
            if (startsAt.HasValue && startsAt.Value > now) return "Scheduled";
            if (expiresAt.HasValue && expiresAt.Value < now) return "Expired";
            if (usageLimit.HasValue && usageCount >= usageLimit.Value) return "UsedUp";
            return "Active";
        }

        private static List<MerchantAnalyticsAlertDto> BuildAlerts(
            AnalyticsSnapshot snapshot,
            int abandonedCarts,
            List<ProductAnalyticsDto> products,
            List<SearchTermAnalyticsDto> searches,
            ReviewAnalyticsDto reviews)
        {
            var alerts = new List<MerchantAnalyticsAlertDto>();

            if (abandonedCarts >= 3)
            {
                alerts.Add(new MerchantAnalyticsAlertDto
                {
                    Type = "abandoned_cart",
                    Severity = "warning",
                    Title = "Cart recovery opportunity",
                    Message = $"{abandonedCarts} shoppers added items but did not order."
                });
            }

            var opportunity = products.FirstOrDefault(p => p.Views >= 5 && p.Orders == 0);
            if (opportunity != null)
            {
                alerts.Add(new MerchantAnalyticsAlertDto
                {
                    Type = "product_interest",
                    Severity = "info",
                    Title = "High interest product",
                    Message = $"{opportunity.ProductName} has {opportunity.Views} views and no orders."
                });
            }

            var missingSearch = searches.FirstOrDefault(s => !s.HasMatchingProduct);
            if (missingSearch != null)
            {
                alerts.Add(new MerchantAnalyticsAlertDto
                {
                    Type = "missing_product",
                    Severity = "info",
                    Title = "Customers are searching for something",
                    Message = $"'{missingSearch.Term}' was searched {missingSearch.Count} times with no clear product match."
                });
            }

            if (snapshot.ProductViews >= 10 && snapshot.ConversionRate < 5)
            {
                alerts.Add(new MerchantAnalyticsAlertDto
                {
                    Type = "low_conversion",
                    Severity = "warning",
                    Title = "Low product conversion",
                    Message = $"Product view to order rate is {snapshot.ConversionRate:0.0}%."
                });
            }

            if (reviews.ReviewsCount >= 3 && reviews.AverageRating < 3.5m)
            {
                alerts.Add(new MerchantAnalyticsAlertDto
                {
                    Type = "reviews",
                    Severity = "critical",
                    Title = "Reviews need attention",
                    Message = $"Average rating is {reviews.AverageRating:0.0} from {reviews.ReviewsCount} reviews."
                });
            }

            return alerts.Take(6).ToList();
        }

        private static List<FunnelStepDto> BuildFunnel(AnalyticsSnapshot snapshot, List<AnalyticsEvent> events)
        {
            var storeVisitors = snapshot.UniqueStoreVisitors;
            var productViewers = snapshot.UniqueProductViewers;
            var adders = UniqueEventKeys(events, AnalyticsEventType.AddToCart);
            var checkoutStarters = UniqueEventKeys(events, AnalyticsEventType.CheckoutStarted);

            return new List<FunnelStepDto>
            {
                new() { Key = "store", Label = "Store visitors", Count = storeVisitors, RateFromPrevious = 100 },
                new() { Key = "product", Label = "Product viewers", Count = productViewers, RateFromPrevious = Rate(productViewers, storeVisitors) },
                new() { Key = "cart", Label = "Added to cart", Count = adders, RateFromPrevious = Rate(adders, productViewers) },
                new() { Key = "checkout", Label = "Started checkout", Count = checkoutStarters, RateFromPrevious = Rate(checkoutStarters, adders) },
                new() { Key = "order", Label = "Orders", Count = snapshot.Orders, RateFromPrevious = Rate(snapshot.Orders, checkoutStarters) }
            };
        }

        private static List<LiveAnalyticsEventDto> BuildLiveFeed(List<AnalyticsEvent> events, List<Order> orders, List<BrandReview> reviews)
        {
            var eventFeed = events
                .OrderByDescending(e => e.CreatedAt)
                .Take(12)
                .Select(e => new LiveAnalyticsEventDto
                {
                    Type = e.EventType.ToString(),
                    Label = e.EventType switch
                    {
                        AnalyticsEventType.BrandView => "Store viewed",
                        AnalyticsEventType.ProductView => "Product opened",
                        AnalyticsEventType.AddToCart => "Added to cart",
                        AnalyticsEventType.CheckoutStarted => "Checkout started",
                        AnalyticsEventType.Search => "Search",
                        _ => "Activity"
                    },
                    Detail = e.EventType == AnalyticsEventType.Search ? e.SearchTerm : e.Product?.Name,
                    At = e.CreatedAt
                });

            var orderFeed = orders
                .OrderByDescending(o => o.CreatedAt)
                .Take(8)
                .Select(o => new LiveAnalyticsEventDto
                {
                    Type = "Order",
                    Label = "New order",
                    Detail = $"#{o.OrderNumber} - {o.Total:0.00}",
                    At = o.CreatedAt
                });

            var reviewFeed = reviews
                .OrderByDescending(r => r.CreatedAt)
                .Take(5)
                .Select(r => new LiveAnalyticsEventDto
                {
                    Type = "Review",
                    Label = "New review",
                    Detail = $"{r.Rating}/5",
                    At = r.CreatedAt
                });

            return eventFeed.Concat(orderFeed).Concat(reviewFeed)
                .OrderByDescending(e => e.At)
                .Take(12)
                .ToList();
        }

        private async Task<List<DailyAnalyticsPointDto>> SyncDailyAggregatesAsync(int brandId, DateTime fromDate, DateTime toDate, List<AnalyticsEvent> events, List<Order> orders)
        {
            var existing = await _context.MerchantDailyAnalytics
                .Where(a => a.BrandId == brandId && a.Date >= fromDate && a.Date <= toDate)
                .ToDictionaryAsync(a => a.Date.Date);

            var result = new List<DailyAnalyticsPointDto>();
            for (var day = fromDate; day <= toDate; day = day.AddDays(1))
            {
                var dayEvents = events.Where(e => e.CreatedAt.Date == day).ToList();
                var dayOrders = orders.Where(o => o.CreatedAt.Date == day).ToList();
                var point = BuildDailyPoint(day, dayEvents, dayOrders);
                result.Add(point);

                if (!existing.TryGetValue(day, out var aggregate))
                {
                    aggregate = new MerchantDailyAnalytics { BrandId = brandId, Date = day };
                    _context.MerchantDailyAnalytics.Add(aggregate);
                }

                aggregate.StoreViews = point.StoreViews;
                aggregate.UniqueStoreVisitors = dayEvents.Where(e => e.EventType == AnalyticsEventType.BrandView).Select(GetVisitorKey).Where(k => k != null).Cast<string>().Distinct().Count();
                aggregate.ProductViews = point.ProductViews;
                aggregate.UniqueProductViewers = dayEvents.Where(e => e.EventType == AnalyticsEventType.ProductView).Select(GetVisitorKey).Where(k => k != null).Cast<string>().Distinct().Count();
                aggregate.AddToCartEvents = point.AddToCartEvents;
                aggregate.CheckoutStartedEvents = point.CheckoutStartedEvents;
                aggregate.Searches = point.Searches;
                aggregate.Orders = point.Orders;
                aggregate.AbandonedCarts = point.AbandonedCarts;
                aggregate.Revenue = point.Revenue;
                aggregate.PromoDiscount = point.PromoDiscount;
                aggregate.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return result;
        }

        private static DailyAnalyticsPointDto BuildDailyPoint(DateTime day, List<AnalyticsEvent> events, List<Order> orders)
        {
            return new DailyAnalyticsPointDto
            {
                Date = day,
                StoreViews = events.Count(e => e.EventType == AnalyticsEventType.BrandView),
                ProductViews = events.Count(e => e.EventType == AnalyticsEventType.ProductView),
                AddToCartEvents = events.Count(e => e.EventType == AnalyticsEventType.AddToCart),
                CheckoutStartedEvents = events.Count(e => e.EventType == AnalyticsEventType.CheckoutStarted),
                Searches = events.Count(e => e.EventType == AnalyticsEventType.Search),
                Orders = orders.Count,
                AbandonedCarts = CountAbandonedCarts(events, orders),
                Revenue = orders.Sum(o => o.Total),
                PromoDiscount = orders.Sum(o => o.DiscountAmount)
            };
        }

        private static AnalyticsSnapshot BuildSnapshot(List<AnalyticsEvent> events, List<Order> orders)
        {
            var storeViews = events.Count(e => e.EventType == AnalyticsEventType.BrandView);
            var productViews = events.Count(e => e.EventType == AnalyticsEventType.ProductView);
            var uniqueProductViewers = events
                .Where(e => e.EventType == AnalyticsEventType.ProductView)
                .Select(GetVisitorKey)
                .Where(k => k != null)
                .Cast<string>()
                .Distinct()
                .Count();

            return new AnalyticsSnapshot
            {
                StoreViews = storeViews,
                UniqueStoreVisitors = events
                    .Where(e => e.EventType == AnalyticsEventType.BrandView)
                    .Select(GetVisitorKey)
                    .Where(k => k != null)
                    .Cast<string>()
                    .Distinct()
                    .Count(),
                ProductViews = productViews,
                UniqueProductViewers = uniqueProductViewers,
                AddToCartEvents = events.Count(e => e.EventType == AnalyticsEventType.AddToCart),
                CheckoutStartedEvents = events.Count(e => e.EventType == AnalyticsEventType.CheckoutStarted),
                Searches = events.Count(e => e.EventType == AnalyticsEventType.Search),
                Orders = orders.Count,
                Revenue = orders.Sum(o => o.Total),
                ConversionRate = uniqueProductViewers == 0 ? 0 : Math.Round((decimal)orders.Count / uniqueProductViewers * 100m, 1)
            };
        }

        private static int CountProductViewersWithoutOrder(List<AnalyticsEvent> events, List<Order> orders)
        {
            var viewerKeys = events
                .Where(e => e.EventType == AnalyticsEventType.ProductView)
                .Select(GetVisitorKey)
                .Where(k => k != null)
                .Cast<string>()
                .Distinct()
                .ToHashSet();

            var buyerKeys = orders.Select(o => $"u:{o.CustomerUserId}").Distinct().ToHashSet();
            return viewerKeys.Except(buyerKeys).Count();
        }

        private static int CountAbandonedCarts(List<AnalyticsEvent> events, List<Order> orders)
        {
            var cartKeys = events
                .Where(e => e.EventType == AnalyticsEventType.AddToCart)
                .Select(GetVisitorKey)
                .Where(k => k != null)
                .Cast<string>()
                .Distinct()
                .ToHashSet();

            var buyerKeys = orders.Select(o => $"u:{o.CustomerUserId}").Distinct().ToHashSet();
            return cartKeys.Except(buyerKeys).Count();
        }

        private static int UniqueEventKeys(List<AnalyticsEvent> events, AnalyticsEventType type)
        {
            return events
                .Where(e => e.EventType == type)
                .Select(GetVisitorKey)
                .Where(k => k != null)
                .Cast<string>()
                .Distinct()
                .Count();
        }

        private static decimal Rate(decimal numerator, decimal denominator)
        {
            return denominator <= 0 ? 0 : Math.Round(numerator / denominator * 100m, 1);
        }

        private static int PercentDelta(int current, int previous)
        {
            if (previous == 0) return current == 0 ? 0 : 100;
            return (int)Math.Round(((decimal)current - previous) / previous * 100m);
        }

        private static decimal PercentDelta(decimal current, decimal previous)
        {
            if (previous == 0) return current == 0 ? 0 : 100;
            return Math.Round((current - previous) / previous * 100m, 1);
        }

        private static (DateTime From, DateTime To, int Days) ResolveRange(int days, DateTime? from, DateTime? to)
        {
            var toUtc = (to ?? DateTime.UtcNow).ToUniversalTime();
            if (days < 1) days = 30;
            if (days > 365) days = 365;

            var fromUtc = from.HasValue ? from.Value.ToUniversalTime() : toUtc.Date.AddDays(-(days - 1));
            if (fromUtc > toUtc) (fromUtc, toUtc) = (toUtc, fromUtc);

            var actualDays = Math.Max(1, (int)Math.Ceiling((toUtc - fromUtc).TotalDays));
            return (fromUtc, toUtc, actualDays);
        }

        private int? GetOptionalUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return int.TryParse(claim?.Value, out var userId) ? userId : null;
        }

        private int GetRequiredUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (!int.TryParse(claim?.Value, out var userId))
                throw new UnauthorizedAccessException();
            return userId;
        }

        private static bool TryParseEventType(string value, out AnalyticsEventType eventType)
        {
            var normalized = value.Trim().Replace("-", "").Replace("_", "").ToLowerInvariant();
            eventType = normalized switch
            {
                "brandview" => AnalyticsEventType.BrandView,
                "productview" => AnalyticsEventType.ProductView,
                "addtocart" => AnalyticsEventType.AddToCart,
                "checkoutstarted" => AnalyticsEventType.CheckoutStarted,
                "search" => AnalyticsEventType.Search,
                "productsearch" => AnalyticsEventType.Search,
                _ => default
            };

            return eventType != default;
        }

        private static string? GetVisitorKey(AnalyticsEvent analyticsEvent)
        {
            if (analyticsEvent.CustomerUserId.HasValue)
                return $"u:{analyticsEvent.CustomerUserId.Value}";
            if (!string.IsNullOrWhiteSpace(analyticsEvent.VisitorId))
                return $"v:{analyticsEvent.VisitorId}";
            if (!string.IsNullOrWhiteSpace(analyticsEvent.SessionId))
                return $"s:{analyticsEvent.SessionId}";
            return null;
        }

        private static string? NormalizeSearchTerm(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            var normalized = Regex.Replace(value.Trim(), @"\s+", " ");
            return normalized.Length <= 120 ? normalized : normalized[..120];
        }

        private static string? TrimToMax(string? value, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            var trimmed = value.Trim();
            return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
        }

        private class AnalyticsSnapshot
        {
            public int StoreViews { get; set; }
            public int UniqueStoreVisitors { get; set; }
            public int ProductViews { get; set; }
            public int UniqueProductViewers { get; set; }
            public int AddToCartEvents { get; set; }
            public int CheckoutStartedEvents { get; set; }
            public int Searches { get; set; }
            public int Orders { get; set; }
            public decimal Revenue { get; set; }
            public decimal ConversionRate { get; set; }
        }
    }
}
