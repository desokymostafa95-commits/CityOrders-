using System;

namespace CityOrders.Api.Domain.Entities
{
    public enum AnalyticsEventType
    {
        BrandView = 1,
        ProductView = 2,
        AddToCart = 3,
        CheckoutStarted = 4,
        Search = 5
    }

    public class AnalyticsEvent
    {
        public int Id { get; set; }

        public int BrandId { get; set; }
        public Brand Brand { get; set; } = null!;

        public int? ProductId { get; set; }
        public Product? Product { get; set; }

        public int? CustomerUserId { get; set; }
        public User? Customer { get; set; }

        public string? VisitorId { get; set; }
        public string? SessionId { get; set; }
        public string? SearchTerm { get; set; }
        public string? MetadataJson { get; set; }
        public AnalyticsEventType EventType { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class MerchantDailyAnalytics
    {
        public int Id { get; set; }
        public int BrandId { get; set; }
        public Brand Brand { get; set; } = null!;
        public DateTime Date { get; set; }
        public int StoreViews { get; set; }
        public int UniqueStoreVisitors { get; set; }
        public int ProductViews { get; set; }
        public int UniqueProductViewers { get; set; }
        public int AddToCartEvents { get; set; }
        public int CheckoutStartedEvents { get; set; }
        public int Searches { get; set; }
        public int Orders { get; set; }
        public int AbandonedCarts { get; set; }
        public decimal Revenue { get; set; }
        public decimal PromoDiscount { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
