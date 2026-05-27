using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using System.Collections.Generic;
using System;

namespace CityOrders.Api.Application.DTOs
{
    public class ApplyMerchantDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        [Required]
        public string Password { get; set; } = string.Empty;

        // Brand Initial Info
        [Required]
        public string BrandName { get; set; } = string.Empty;
        public string? BrandAddress { get; set; }
        public string? BrandPhone { get; set; }
        public int MarketSectorId { get; set; } = 1;
        public List<int> MasterCategoryIds { get; set; } = new();
    }

    public class BrandDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? Phone1 { get; set; }
        public bool IsActive { get; set; }
        public int MarketSectorId { get; set; }
        public AdminMarketSectorDto? MarketSector { get; set; }
        public List<int> MasterCategoryIds { get; set; } = new();
        public List<AdminCategoryDto> MasterCategories { get; set; } = new();
        public decimal FixedDeliveryFee { get; set; }
        public decimal MinVariableDeliveryFee { get; set; }
        public decimal MaxVariableDeliveryFee { get; set; }
        public string DeliveryFeeType { get; set; } = "Fixed";
        public decimal BaseDeliveryFee { get; set; }
        public decimal FeePerKilometer { get; set; }
        public decimal? MinDeliveryFee { get; set; }
        public decimal? MaxDeliveryFee { get; set; }
        public decimal? MaxDeliveryDistanceKm { get; set; }
        public string? LogoUrl { get; set; }
    }

    public class ProductDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public bool IsActive { get; set; }
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public string? PrimaryImageUrl { get; set; }
        public string UnitType { get; set; } = "Unit";
        public decimal QuantityStep { get; set; } = 1.0m;
        public bool AllowFractionalQuantity { get; set; }
    }

    public class CreateProductDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        [Required]
        public decimal Price { get; set; }
        public int? CategoryId { get; set; }
        public string? PhotoUrl { get; set; }
        public string UnitType { get; set; } = "Unit";
        public decimal QuantityStep { get; set; } = 1.0m;
        public bool AllowFractionalQuantity { get; set; }
    }

    public class ApplyMerchantLoggedInDto
    {
        [Required]
        public string BrandName { get; set; } = string.Empty;
        public string? BrandAddress { get; set; }
        public string? BrandPhone { get; set; }
        public int MarketSectorId { get; set; } = 1;
        public List<int> MasterCategoryIds { get; set; } = new();
        public decimal FixedDeliveryFee { get; set; }
        public decimal MinVariableDeliveryFee { get; set; }
        public decimal MaxVariableDeliveryFee { get; set; }
        public string DeliveryFeeType { get; set; } = "Fixed";
        public decimal BaseDeliveryFee { get; set; }
        public decimal FeePerKilometer { get; set; }
        public decimal? MinDeliveryFee { get; set; }
        public decimal? MaxDeliveryFee { get; set; }
        public decimal? MaxDeliveryDistanceKm { get; set; }
    }

    public class UpdateProductDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than 0")]
        public decimal Price { get; set; }

        public int? CategoryId { get; set; }
        public bool? IsActive { get; set; }
        public string? UnitType { get; set; }
        public decimal? QuantityStep { get; set; }
        public bool? AllowFractionalQuantity { get; set; }
        public string? PhotoUrl { get; set; }
    }

    public class MerchantProfileDto
    {
        public int UserId { get; set; }
        public bool IsApproved { get; set; }
        public bool IsActive { get; set; }
        public bool HasBrand { get; set; }
        public string? BrandName { get; set; }
    }

    public class MerchantAvailabilityDto
    {
        public bool IsOnShift { get; set; }
        public bool IsTemporarilyClosed { get; set; }
        public string? TemporaryCloseReason { get; set; }
        public DateTime? TemporaryCloseUntil { get; set; }
    }

    public class TemporaryCloseDto
    {
        [MaxLength(200)]
        public string? Reason { get; set; }
        public DateTime? Until { get; set; }
    }
    public class MerchantStoreLocationDto
    {
        public decimal Lat { get; set; }
        public decimal Lng { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
