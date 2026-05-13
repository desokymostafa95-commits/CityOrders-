using System;
using System.ComponentModel.DataAnnotations;

namespace CityOrders.Api.Domain.Entities
{
    public enum AnnouncementTarget
    {
        All = 0,
        Customer = 1,
        Merchant = 2
    }

    public class GlobalAnnouncement
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Message { get; set; } = string.Empty;

        public AnnouncementTarget TargetAudience { get; set; } = AnnouncementTarget.All;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;

        public DateTime? ExpiresAt { get; set; }
    }
}
