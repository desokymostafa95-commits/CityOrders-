using System;
using System.ComponentModel.DataAnnotations;
using CityOrders.Api.Domain.Entities;

namespace CityOrders.Api.Application.DTOs
{
    public class CreateAnnouncementDto
    {
        [Required]
        [MaxLength(2000)]
        public string Message { get; set; } = string.Empty;

        public AnnouncementTarget TargetAudience { get; set; } = AnnouncementTarget.All;

        public DateTime? ExpiresAt { get; set; }
    }

    public class AnnouncementResponseDto
    {
        public int Id { get; set; }
        public string Message { get; set; } = string.Empty;
        public string TargetAudience { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }
}
