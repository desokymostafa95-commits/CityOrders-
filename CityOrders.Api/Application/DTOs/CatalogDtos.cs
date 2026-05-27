namespace CityOrders.Api.Application.DTOs
{
    /// <summary>
    /// Top-level commerce sector shown before master categories.
    /// </summary>
    public class CatalogMarketSectorDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? IconKey { get; set; }
        public string? ImageUrl { get; set; }
        public int SortOrder { get; set; }
        public int CategoriesCount { get; set; }
        public int BrandsCount { get; set; }
    }

    /// <summary>
    /// Category DTO for catalog endpoint
    /// </summary>
    public class CatalogCategoryDto
    {
        public int Id { get; set; }
        public int MarketSectorId { get; set; }
        public string MarketSectorName { get; set; } = string.Empty;
        public string MarketSectorSlug { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? IconKey { get; set; }
        public string? ImageUrl { get; set; }
        public int SortOrder { get; set; }
    }

    /// <summary>
    /// Brand DTO for enhanced catalog list with delivery pricing
    /// </summary>
    public class CatalogBrandDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? Phone1 { get; set; }
        public bool IsActive { get; set; }
        public string? LogoUrl { get; set; }
        public int MarketSectorId { get; set; }
        public string? MarketSectorName { get; set; }
        public string? MarketSectorSlug { get; set; }
        public List<string> CategoryTags { get; set; } = new();
        public DeliveryPricingDto? DeliveryPricing { get; set; }
        public int? DistanceMeters { get; set; }
        public decimal? EstimatedDeliveryFee { get; set; }
        public double? AverageRating { get; set; }
        public int ReviewsCount { get; set; }
    }

    /// <summary>
    /// Delivery pricing configuration for a brand
    /// </summary>
    public class DeliveryPricingDto
    {
        public decimal BaseFee { get; set; }
        public decimal FeePerMeter { get; set; }
        public decimal? MinFee { get; set; }
        public decimal? MaxFee { get; set; }
        public int? MaxDistanceMeters { get; set; }
    }

    /// <summary>
    /// Response for delivery quote calculation
    /// </summary>
    public class DeliveryQuoteDto
    {
        public int BrandId { get; set; }
        public int AddressId { get; set; }
        public int DistanceMeters { get; set; }
        public decimal DeliveryFee { get; set; }
        public bool IsDeliverable { get; set; }
        public string? Reason { get; set; }
    }

    public class CatalogBrandReviewDto
    {
        public int Id { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
