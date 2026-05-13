using System;
using System.Collections.Generic;

namespace CityOrders.Api.Domain.Entities
{
    public enum ShiftStatus
    {
        Open = 1,
        Closed = 2
    }

    public class MerchantShift
    {
        public int Id { get; set; }
        
        public int BrandId { get; set; }
        public Brand Brand { get; set; } = null!;

        public string InvoiceNumber { get; set; } = string.Empty;
        
        public DateTime StartAt { get; set; }
        public DateTime? EndAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        
        public ShiftStatus Status { get; set; }

        public int DeliveredOrdersCount { get; set; }
        public decimal GrossSales { get; set; }
        public string Currency { get; set; } = "EGP";

        // Snapshot of brand info at time of invoice
        public string BrandNameSnapshot { get; set; } = string.Empty;
        public string? BrandAddressSnapshot { get; set; }
        public string? BrandPhoneSnapshot { get; set; }

        public string? PdfUrl { get; set; }

        public ICollection<MerchantShiftOrder> Orders { get; set; } = new List<MerchantShiftOrder>();
        public ICollection<MerchantShiftLine> Lines { get; set; } = new List<MerchantShiftLine>();
    }

    public class MerchantShiftOrder
    {
        public int Id { get; set; }
        
        public int MerchantShiftId { get; set; }
        public MerchantShift MerchantShift { get; set; } = null!;

        public int OrderId { get; set; }
        public Order Order { get; set; } = null!;

        public string OrderNumberSnapshot { get; set; } = string.Empty;
        public decimal TotalSnapshot { get; set; }
        public DateTime DeliveredAtSnapshot { get; set; }
    }

    public class MerchantShiftLine
    {
        public int Id { get; set; }
        
        public int MerchantShiftId { get; set; }
        public MerchantShift MerchantShift { get; set; } = null!;

        public int? ProductId { get; set; }
        public Product? Product { get; set; }

        public string ProductNameSnapshot { get; set; } = string.Empty;
        public decimal UnitPriceSnapshot { get; set; }
        public int Quantity { get; set; }
        public decimal LineTotal { get; set; }
    }
}
