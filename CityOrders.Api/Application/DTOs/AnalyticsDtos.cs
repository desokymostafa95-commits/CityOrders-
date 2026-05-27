namespace CityOrders.Api.Application.DTOs
{
    public class TrackAnalyticsEventDto
    {
        public int BrandId { get; set; }
        public int? ProductId { get; set; }
        public string EventType { get; set; } = string.Empty;
        public string? VisitorId { get; set; }
        public string? SessionId { get; set; }
        public string? SearchTerm { get; set; }
        public string? MetadataJson { get; set; }
    }

    public class MerchantAnalyticsOverviewDto
    {
        public DateTime From { get; set; }
        public DateTime To { get; set; }
        public int Days { get; set; }
        public int StoreViews { get; set; }
        public int UniqueStoreVisitors { get; set; }
        public int ProductViews { get; set; }
        public int UniqueProductViewers { get; set; }
        public int AddToCartEvents { get; set; }
        public int CheckoutStartedEvents { get; set; }
        public int Searches { get; set; }
        public int Orders { get; set; }
        public decimal Revenue { get; set; }
        public decimal PromoDiscount { get; set; }
        public int AbandonedCarts { get; set; }
        public int ProductViewersWithoutOrder { get; set; }
        public decimal ProductViewToOrderRate { get; set; }
        public decimal StoreToProductRate { get; set; }
        public decimal ProductToCartRate { get; set; }
        public decimal CartToCheckoutRate { get; set; }
        public decimal CheckoutToOrderRate { get; set; }
        public AnalyticsComparisonDto Comparison { get; set; } = new();
        public List<FunnelStepDto> Funnel { get; set; } = new();
        public List<ProductAnalyticsDto> Products { get; set; } = new();
        public List<ProductAnalyticsDto> OpportunityProducts { get; set; } = new();
        public List<SearchTermAnalyticsDto> SearchTerms { get; set; } = new();
        public List<PromoAnalyticsDto> Promos { get; set; } = new();
        public ReviewAnalyticsDto Reviews { get; set; } = new();
        public List<MerchantAnalyticsAlertDto> Alerts { get; set; } = new();
        public List<LiveAnalyticsEventDto> LiveFeed { get; set; } = new();
        public List<DailyAnalyticsPointDto> Daily { get; set; } = new();
    }

    public class AnalyticsComparisonDto
    {
        public int StoreViewsDelta { get; set; }
        public int ProductViewsDelta { get; set; }
        public int OrdersDelta { get; set; }
        public decimal RevenueDelta { get; set; }
        public decimal ConversionRateDelta { get; set; }
    }

    public class FunnelStepDto
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal RateFromPrevious { get; set; }
    }

    public class ProductAnalyticsDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int Views { get; set; }
        public int UniqueViewers { get; set; }
        public int AddToCartCount { get; set; }
        public int Orders { get; set; }
        public decimal QuantitySold { get; set; }
        public int ViewersWithoutOrder { get; set; }
        public int AbandonedCarts { get; set; }
        public decimal Revenue { get; set; }
        public decimal ConversionRate { get; set; }
        public string Insight { get; set; } = string.Empty;
    }

    public class SearchTermAnalyticsDto
    {
        public string Term { get; set; } = string.Empty;
        public int Count { get; set; }
        public bool HasMatchingProduct { get; set; }
        public DateTime LastSearchedAt { get; set; }
    }

    public class PromoAnalyticsDto
    {
        public int PromoCodeId { get; set; }
        public string Code { get; set; } = string.Empty;
        public int Uses { get; set; }
        public decimal Revenue { get; set; }
        public decimal DiscountGiven { get; set; }
        public decimal AverageOrderValue { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class ReviewAnalyticsDto
    {
        public int ReviewsCount { get; set; }
        public decimal AverageRating { get; set; }
        public int LowRatingCount { get; set; }
        public List<ReviewKeywordDto> Keywords { get; set; } = new();
        public List<LatestReviewDto> Latest { get; set; } = new();
    }

    public class ReviewKeywordDto
    {
        public string Word { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class LatestReviewDto
    {
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class MerchantAnalyticsAlertDto
    {
        public string Type { get; set; } = string.Empty;
        public string Severity { get; set; } = "info";
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    public class LiveAnalyticsEventDto
    {
        public string Type { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string? Detail { get; set; }
        public DateTime At { get; set; }
    }

    public class DailyAnalyticsPointDto
    {
        public DateTime Date { get; set; }
        public int StoreViews { get; set; }
        public int ProductViews { get; set; }
        public int AddToCartEvents { get; set; }
        public int CheckoutStartedEvents { get; set; }
        public int Searches { get; set; }
        public int Orders { get; set; }
        public int AbandonedCarts { get; set; }
        public decimal Revenue { get; set; }
        public decimal PromoDiscount { get; set; }
    }

    public class AdminAnalyticsOverviewDto
    {
        public DateTime From { get; set; }
        public DateTime To { get; set; }
        public int StoreViews { get; set; }
        public int ProductViews { get; set; }
        public int AddToCartEvents { get; set; }
        public int CheckoutStartedEvents { get; set; }
        public int Searches { get; set; }
        public int Orders { get; set; }
        public decimal Revenue { get; set; }
        public int AbandonedCarts { get; set; }
        public decimal PlatformConversionRate { get; set; }
        public List<AdminSectorAnalyticsDto> SectorBreakdown { get; set; } = new();
        public List<AdminMerchantAnalyticsDto> TopMerchants { get; set; } = new();
        public List<SearchTermAnalyticsDto> SearchTerms { get; set; } = new();
        public List<LiveAnalyticsEventDto> LiveFeed { get; set; } = new();
    }

    public class AdminSectorAnalyticsDto
    {
        public int MarketSectorId { get; set; }
        public string MarketSectorName { get; set; } = string.Empty;
        public string MarketSectorSlug { get; set; } = string.Empty;
        public int StoreViews { get; set; }
        public int ProductViews { get; set; }
        public int Orders { get; set; }
        public decimal Revenue { get; set; }
        public decimal ConversionRate { get; set; }
    }

    public class AdminMerchantAnalyticsDto
    {
        public int BrandId { get; set; }
        public string BrandName { get; set; } = string.Empty;
        public int StoreViews { get; set; }
        public int ProductViews { get; set; }
        public int Orders { get; set; }
        public decimal Revenue { get; set; }
        public decimal ConversionRate { get; set; }
    }
}
