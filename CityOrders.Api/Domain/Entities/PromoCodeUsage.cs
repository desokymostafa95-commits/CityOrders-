using System;

namespace CityOrders.Api.Domain.Entities
{
    public class PromoCodeUsage
    {
        public int Id { get; set; }

        public int PromoCodeId { get; set; }
        public PromoCode PromoCode { get; set; } = null!;

        public int CustomerUserId { get; set; }
        public User Customer { get; set; } = null!;

        public int OrderId { get; set; }
        public Order Order { get; set; } = null!;

        public decimal DiscountApplied { get; set; }

        public DateTime UsedAt { get; set; } = DateTime.UtcNow;
    }
}
