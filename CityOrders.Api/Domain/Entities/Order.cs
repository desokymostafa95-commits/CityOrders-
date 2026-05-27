using System;
using System.Collections.Generic;

namespace CityOrders.Api.Domain.Entities
{
    public enum OrderStatus
    {
        Pending = 1,
        Accepted = 2,
        Preparing = 3,
        OutForDelivery = 4,
        Delivered = 5,
        Cancelled = 6
    }

    public class Order
    {
        public int Id { get; set; }
        
        public string OrderNumber { get; set; } = string.Empty;
        
        public int CustomerUserId { get; set; }
        public User Customer { get; set; } = null!;

        public int BrandId { get; set; }
        public Brand Brand { get; set; } = null!;

        public int? DeliveryUserId { get; set; }
        public User? DeliveryUser { get; set; }

        public OrderStatus Status { get; set; }

        public int? DeliveryAddressId { get; set; }
        public CustomerAddress? DeliveryAddress { get; set; }

        public string? Notes { get; set; }
        public decimal Subtotal { get; set; }
        public decimal DeliveryFee { get; set; }
        public decimal DiscountAmount { get; set; } = 0;
        public decimal Total { get; set; }

        // Promo code snapshot
        public int? PromoCodeId { get; set; }
        public PromoCode? PromoCode { get; set; }
        public string? PromoCodeSnapshot { get; set; }

        // Delivery pricing snapshot (for audit trail)

        public int? DistanceMeters { get; set; }
        public decimal? BaseDeliveryFeeSnapshot { get; set; }
        public decimal? FeePerMeterSnapshot { get; set; }
        public decimal? MinDeliveryFeeSnapshot { get; set; }
        public decimal? MaxDeliveryFeeSnapshot { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? DeliveredAt { get; set; }

        public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
        public DeliveryAssignment? DeliveryAssignment { get; set; }
    }
}
