using System.ComponentModel.DataAnnotations;

namespace CityOrders.Api.Application.DTOs
{
    public class PaymentMethodDto
    {
        public int Id { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public string? ReceiverName { get; set; }
        public string ReceiverNumber { get; set; } = string.Empty;
        public string? Instructions { get; set; }
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
    }

    public class CreatePaymentMethodDto
    {
        [Required]
        [MaxLength(100)]
        public string DisplayName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? ReceiverName { get; set; }

        [Required]
        [MaxLength(50)]
        public string ReceiverNumber { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Instructions { get; set; }

        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;
    }

    public class UpdatePaymentMethodDto
    {
        [MaxLength(100)]
        public string? DisplayName { get; set; }

        [MaxLength(100)]
        public string? ReceiverName { get; set; }

        [MaxLength(50)]
        public string? ReceiverNumber { get; set; }

        [MaxLength(500)]
        public string? Instructions { get; set; }

        public bool? IsActive { get; set; }
        public int? SortOrder { get; set; }
    }
}
