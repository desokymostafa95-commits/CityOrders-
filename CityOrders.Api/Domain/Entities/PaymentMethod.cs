using System.ComponentModel.DataAnnotations;

namespace CityOrders.Api.Domain.Entities
{
    public class PaymentMethod
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string DisplayName { get; set; } = string.Empty; // e.g., "Vodafone Cash"

        [MaxLength(100)]
        public string? ReceiverName { get; set; } // e.g., "Ahmed Mostafa"

        [Required]
        [MaxLength(50)]
        public string ReceiverNumber { get; set; } = string.Empty; // e.g., "010xxxxxxx" or InstaPay handle

        [MaxLength(500)]
        public string? Instructions { get; set; }

        public bool IsActive { get; set; } = true;

        public int SortOrder { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
