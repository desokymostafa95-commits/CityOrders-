using System;
using System.Collections.Generic;

namespace CityOrders.Api.Domain.Entities
{
    public class Brand
    {
        public int Id { get; set; }
        
        public int MerchantUserId { get; set; }
        public MerchantProfile MerchantProfile { get; set; } = null!;
        public int MarketSectorId { get; set; } = 1;
        public MarketSector MarketSector { get; set; } = null!;
        // Assuming MerchantProfile is the navigation, but actually the FK is to Users.Id in the spec. 
        // However, MerchantProfile has PK=FK to userId. So linking to MerchantProfile or User is similar. 
        // Spec says: MerchantUserId FK -> Users.Id (UNIQUE constraint to enforce 1:1)
        // Let's stick to spec, but navigation might be to User or MerchantProfile? 
        // In EF Core, if MerchantProfile PK is UserId, we can map Brand to MerchantProfile.
        // Actually, let's keep it simple: Brand belongs to a Merchant (User).
        
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? Phone1 { get; set; }
        public string? Phone2 { get; set; }
        // public string? Category { get; set; } // Legacy field
        public decimal FixedDeliveryFee { get; set; }
        public decimal MinVariableDeliveryFee { get; set; }
        public decimal MaxVariableDeliveryFee { get; set; }
        public string DeliveryFeeType { get; set; } = "Fixed"; // "Fixed" or "Variable"
        public decimal? LocationLat { get; set; }
        public decimal? LocationLng { get; set; }
        public DateTime? LocationUpdatedAt { get; set; }
        public string? LogoUrl { get; set; }

        // Distance-based delivery pricing
        public decimal BaseDeliveryFee { get; set; } = 0;
        public decimal FeePerMeter { get; set; } = 0;
        public decimal? MinDeliveryFee { get; set; }
        public decimal? MaxDeliveryFee { get; set; }
        public int? MaxDeliveryDistanceMeters { get; set; }

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Product> Products { get; set; } = new List<Product>();
        public ICollection<BrandCategory> Categories { get; set; } = new List<BrandCategory>();
        public ICollection<Category> MasterCategories { get; set; } = new List<Category>();
    }
}
