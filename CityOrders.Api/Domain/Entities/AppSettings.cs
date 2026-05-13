using System;

namespace CityOrders.Api.Domain.Entities
{
    public class AppSettings
    {
        public int Id { get; set; }
        public bool IsFreeTrialEnabled { get; set; } = true;
        public int FreeTrialDays { get; set; } = 14;
        public int TrialGraceDays { get; set; } = 3;
        public int TrialMaxConcurrentOffers { get; set; } = 1;
        public int DefaultGraceDays { get; set; } = 3; // Keep for backward compat or remove if unused, plan said alias. Let's keep both or repurpose.
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
