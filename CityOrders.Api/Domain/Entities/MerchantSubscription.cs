using System;

namespace CityOrders.Api.Domain.Entities
{
    public class MerchantSubscription
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int? PlanId { get; set; }  // Nullable for trial subscriptions
        public bool IsTrial { get; set; } = false;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime GraceEndDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public User User { get; set; } = null!;
        public SubscriptionPlan? Plan { get; set; }


        // Computed state (not stored)
        public string GetState()
        {
            var now = DateTime.UtcNow;
            if (now <= EndDate) return "Active";
            if (now <= GraceEndDate) return "Grace";
            return "Expired";
        }

        public int GetDaysRemaining()
        {
            return (int)(EndDate - DateTime.UtcNow).TotalDays;
        }
    }
}
