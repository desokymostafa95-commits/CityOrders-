using System;

namespace CityOrders.Api.Domain.Entities
{
    public class SubscriptionPlan
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal PriceEgp { get; set; }
        public int DurationDays { get; set; }
        public int GraceDays { get; set; } = 7;
        public bool IsEnabled { get; set; } = true;
        public int MaxConcurrentOffers { get; set; } = 1;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public ICollection<MerchantSubscription> MerchantSubscriptions { get; set; } = new List<MerchantSubscription>();
        public ICollection<SubscriptionPaymentRequest> PaymentRequests { get; set; } = new List<SubscriptionPaymentRequest>();
    }
}
