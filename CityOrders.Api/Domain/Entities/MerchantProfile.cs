using System;

namespace CityOrders.Api.Domain.Entities
{
    public class MerchantProfile
    {
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public bool IsApproved { get; set; } = false; // New merchants must be manually approved by admin
        public bool IsActive { get; set; } = true;
        public bool IsOnShift { get; set; } = false;
        public DateTime? ShiftUpdatedAt { get; set; }
        public DateTime? ShiftAutoCloseAt { get; set; }
        public DateTime? ShiftAutoClosedBySystemAt { get; set; }

        public bool IsTemporarilyClosed { get; set; } = false;
        public string? TemporaryCloseReason { get; set; }
        public DateTime? TemporaryCloseUntil { get; set; }
        public string? ApprovalRequestReason { get; set; }
        public string? RejectionReason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // One-to-one with Brand (Merchant has one brand)
        public Brand? Brand { get; set; } 
    }
}
