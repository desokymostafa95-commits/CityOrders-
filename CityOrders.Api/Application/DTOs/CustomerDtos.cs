using System.ComponentModel.DataAnnotations;

namespace CityOrders.Api.Application.DTOs
{
    public class CustomerMeDto
    {
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public List<string> Roles { get; set; } = new();
        public bool HasCustomerProfile { get; set; }
        public bool HasMerchantProfile { get; set; }
        public bool? IsMerchantApproved { get; set; }
        public int? BrandId { get; set; }
        public string? BrandName { get; set; }
    }

    public class AddressDto
    {
        public int Id { get; set; }
        public string AddressLine { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public bool IsDefault { get; set; }
        public decimal? Lat { get; set; }
        public decimal? Lng { get; set; }
    }

    public class CreateAddressDto
    {
        [Required]
        public string AddressLine { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public bool IsDefault { get; set; } = false;
        
        [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90")]
        public decimal? Lat { get; set; }
        
        [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180")]
        public decimal? Lng { get; set; }
    }

    public class UpdateAddressDto
    {
        [Required]
        public string AddressLine { get; set; } = string.Empty;
        public string? Notes { get; set; }
        
        [Range(-90, 90, ErrorMessage = "Latitude must be between -90 and 90")]
        public decimal? Lat { get; set; }
        
        [Range(-180, 180, ErrorMessage = "Longitude must be between -180 and 180")]
        public decimal? Lng { get; set; }
    }
}
