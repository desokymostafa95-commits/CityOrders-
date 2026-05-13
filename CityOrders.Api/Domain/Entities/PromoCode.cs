using System;
using System.Collections.Generic;

namespace CityOrders.Api.Domain.Entities
{
    public class PromoCode
    {
        public int Id { get; set; }

        public int BrandId { get; set; }
        public Brand Brand { get; set; } = null!;

        /// <summary>Uppercase code customers enter at checkout, e.g. "SUMMER20"</summary>
        public string Code { get; set; } = string.Empty;

        /// <summary>"Percentage" or "Fixed"</summary>
        public string DiscountType { get; set; } = "Percentage";

        /// <summary>Percent value (0-100) or fixed EGP amount</summary>
        public decimal DiscountValue { get; set; }

        /// <summary>Maximum EGP discount for percentage codes (null = no cap)</summary>
        public decimal? MaxDiscountAmount { get; set; }

        /// <summary>Minimum order subtotal required to use this code</summary>
        public decimal? MinOrderAmount { get; set; }

        /// <summary>Maximum total redemptions (null = unlimited)</summary>
        public int? UsageLimit { get; set; }

        /// <summary>Auto-incremented on each valid use</summary>
        public int UsageCount { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime? StartsAt { get; set; }
        public DateTime? ExpiresAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<PromoCodeUsage> Usages { get; set; } = new List<PromoCodeUsage>();
    }
}
