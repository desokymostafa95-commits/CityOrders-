using System;
using System.Collections.Generic;

namespace CityOrders.Api.Application.DTOs
{
    public class CurrentShiftDto
    {
        public int? ShiftId { get; set; }
        public DateTime? StartAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public LiveStatsDto? LiveStats { get; set; }
    }

    public class LiveStatsDto
    {
        public int DeliveredOrdersCount { get; set; }
        public decimal EstimatedGrossSales { get; set; }
    }

    public class StartShiftResponseDto
    {
        public int ShiftId { get; set; }
        public DateTime StartAt { get; set; }
        public string Status { get; set; } = "Open";
    }

    public class CloseShiftResponseDto
    {
        public int InvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }
        public int DeliveredOrdersCount { get; set; }
        public decimal GrossSales { get; set; }
        public string Currency { get; set; } = "EGP";
        public DateTime ClosedAt { get; set; }
    }

    public class InvoiceSummaryDto
    {
        public int InvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }
        public DateTime ClosedAt { get; set; }
        public int DeliveredOrdersCount { get; set; }
        public decimal GrossSales { get; set; }
        public string Currency { get; set; } = string.Empty;
    }

    public class InvoiceDetailDto : InvoiceSummaryDto
    {
        public string Status { get; set; } = string.Empty;
        public InvoiceBrandSnapshotDto Brand { get; set; } = null!;
        public List<InvoiceLineDto> Lines { get; set; } = new();
        public List<InvoiceOrderDto> Orders { get; set; } = new();
    }

    public class InvoiceBrandSnapshotDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? Phone { get; set; }
    }

    public class InvoiceLineDto
    {
        public int? ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public decimal Quantity { get; set; }
        public decimal LineTotal { get; set; }
    }

    public class InvoiceOrderDto
    {
        public int OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public decimal OrderTotal { get; set; }
        public DateTime DeliveredAt { get; set; }
    }
}
