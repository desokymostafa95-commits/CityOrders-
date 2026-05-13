using System;
using System.ComponentModel.DataAnnotations;

namespace CityOrders.Api.Application.DTOs
{
    public class MerchantOfferDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? ProductImageUrl { get; set; }
        public decimal OriginalPrice { get; set; }
        public decimal OfferPrice { get; set; }
        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }
        public bool IsActive { get; set; }
        public string Status { get; set; } = string.Empty; // "Scheduled", "Active", "Expired"
    }

    public class CreateOfferDto
    {
        [Required]
        public int ProductId { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Offer price must be greater than 0")]
        public decimal OfferPrice { get; set; }

        [Required]
        public DateTime StartAt { get; set; }

        [Required]
        public DateTime EndAt { get; set; }
    }

    public class UpdateOfferDto : CreateOfferDto
    {
        public bool IsActive { get; set; } = true;
    }

    public class CatalogOfferDto
    {
        public int BrandId { get; set; }
        public string BrandName { get; set; } = string.Empty;
        public string? BrandLogoUrl { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? ProductImageUrl { get; set; }
        public decimal OriginalPrice { get; set; }
        public decimal OfferPrice { get; set; }
        public DateTime EndAt { get; set; }
    }
}
