using System;

namespace CityOrders.Api.Domain.Entities
{
    public class AuditLog
    {
        public int Id { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Action { get; set; } = string.Empty; // e.g., "SubscriptionExtend"
        public string Target { get; set; } = string.Empty; // e.g., "Merchant: 123"
        public string Summary { get; set; } = string.Empty;
        public string AdminEmail { get; set; } = string.Empty;
        public string AdminName { get; set; } = string.Empty;
    }
}
