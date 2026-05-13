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
        public int Quantity { get; set; }
    }

    public class OrderDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal Total { get; set; }
        public string BrandName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int QuantityItems { get; set; }
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
    }

    public class OrderItemDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public decimal LineTotal { get; set; }
    }
}
