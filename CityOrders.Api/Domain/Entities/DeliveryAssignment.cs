namespace CityOrders.Api.Domain.Entities
{
    public enum DeliveryAssignmentSource
    {
        MerchantPrivate = 1,
        PlatformPool = 2,
        ManualAdmin = 3
    }

    public enum DeliveryAssignmentStatus
    {
        Offered = 1,
        Accepted = 2,
        PickedUp = 3,
        Delivered = 4,
        Cancelled = 5
    }

    public enum DeliveryCollectionRecipient
    {
        Platform = 1,
        DeliveryOffice = 2
    }

    public enum DeliveryCollectionStatus
    {
        NotRequired = 0,
        Pending = 1,
        Collected = 2
    }

    public class DeliveryAssignment
    {
        public int Id { get; set; }

        public int OrderId { get; set; }
        public Order Order { get; set; } = null!;

        public DeliveryAssignmentSource Source { get; set; }
        public DeliveryAssignmentStatus Status { get; set; } = DeliveryAssignmentStatus.Offered;

        public int? AgentUserId { get; set; }
        public User? AgentUser { get; set; }

        public int? DeliveryOfficeId { get; set; }
        public DeliveryOffice? DeliveryOffice { get; set; }

        public decimal DeliveryFeeSnapshot { get; set; }
        public decimal? PlatformCommissionPercent { get; set; }
        public decimal? PlatformCommissionAmount { get; set; }
        public decimal? OfficeCommissionPercent { get; set; }
        public decimal? OfficeCommissionAmount { get; set; }
        public decimal? AgentEarningAmount { get; set; }

        public DeliveryCollectionRecipient? CollectionRecipient { get; set; }
        public DeliveryCollectionStatus CollectionStatus { get; set; } = DeliveryCollectionStatus.NotRequired;
        public decimal? CollectionAmount { get; set; }
        public int? CollectionCycleDays { get; set; }
        public DateTime? CollectionDueAt { get; set; }
        public string? CollectionMethod { get; set; }
        public string? CollectionMethodsSnapshot { get; set; }
        public DateTime? CollectedAt { get; set; }
        public int? CollectedByUserId { get; set; }
        public User? CollectedByUser { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? AcceptedAt { get; set; }
        public DateTime? PickedUpAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public DateTime? CancelledAt { get; set; }
        public string? CancellationReason { get; set; }
    }
}
