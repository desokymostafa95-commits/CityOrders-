using System;

namespace CityOrders.Api.Domain.Entities
{
    public class DeliveryPaymentRequest
    {
        public int Id { get; set; }
        public int AgentUserId { get; set; }
        public int PlanId { get; set; }
        public decimal Amount { get; set; }
        public string ProofFilePath { get; set; } = string.Empty;
        public string PayerNumber { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
        public string? AdminNotes { get; set; }
        public int? ReviewedByUserId { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User AgentUser { get; set; } = null!;
        public DeliveryPlan Plan { get; set; } = null!;
        public User? ReviewedByUser { get; set; }
    }
}
