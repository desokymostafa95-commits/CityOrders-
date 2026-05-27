using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CityOrders.Api.Application.DTOs
{
    public class CreateOrderDto
    {
        [Required]
        public int BrandId { get; set; }

        [Required]
        public int DeliveryAddressId { get; set; }

        public string? Notes { get; set; }

        /// <summary>Optional promo code to apply at checkout</summary>
        public string? PromoCode { get; set; }

        [Required]
        public List<CreateOrderItemDto> Items { get; set; } = new();
    }

    public class CreateOrderItemDto
    {
        [Required]
        public int ProductId { get; set; }
        [Required]
        public decimal Quantity { get; set; }
    }

    public class OrderDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal Total { get; set; }
        public string BrandName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public decimal QuantityItems { get; set; }
        public decimal DeliveryFeeApplied { get; set; }
        public int? DistanceMeters { get; set; }
    }

    public class OrderDetailDto : OrderDto
    {
        public string? Notes { get; set; }
        public decimal Subtotal { get; set; }
        public decimal DeliveryFee { get; set; }
        public decimal DiscountAmount { get; set; }
        public string? PromoCode { get; set; }
        public string DeliveryAddress { get; set; } = string.Empty;
        public List<OrderItemDto> Items { get; set; } = new();
        public List<OrderTimelineItemDto> Timeline { get; set; } = new();
        public string NextStep { get; set; } = string.Empty;
        public bool CanReview { get; set; }
        public BrandReviewDto? Review { get; set; }
    }

    public class OrderTimelineItemDto
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool Completed { get; set; }
        public DateTime? At { get; set; }
    }

    public class MerchantOrderDetailDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal Total { get; set; }
        public decimal Subtotal { get; set; }
        public decimal DeliveryFee { get; set; }
        public decimal DiscountAmount { get; set; }
        public string? PromoCode { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string DeliveryAddress { get; set; } = string.Empty;
        public string? AddressNotes { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public int? DistanceMeters { get; set; }
        public decimal QuantityItems { get; set; }
        public List<OrderItemDto> Items { get; set; } = new();
        public List<OrderTimelineItemDto> Timeline { get; set; } = new();
        public List<OrderActionDto> AvailableActions { get; set; } = new();
    }

    public class OrderActionDto
    {
        public string Action { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public bool Destructive { get; set; }
    }

    public class OrderItemDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public decimal Quantity { get; set; }
        public decimal LineTotal { get; set; }
    }
}
