using System;
using System.Collections.Generic;

namespace CityOrders.Api.Domain.Entities
{
    public class DeliveryPlan
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal PriceEgp { get; set; }
        public int DurationDays { get; set; }
        public bool IsEnabled { get; set; } = true;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<DeliveryPaymentRequest> PaymentRequests { get; set; } = new List<DeliveryPaymentRequest>();
    }
}
