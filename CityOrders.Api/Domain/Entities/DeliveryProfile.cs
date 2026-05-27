namespace CityOrders.Api.Domain.Entities
{
    public enum DeliveryAgentType
    {
        MerchantOwned = 1,
        Independent = 2,
        Office = 3
    }

    public class DeliveryProfile
    {
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public DeliveryAgentType AgentType { get; set; } = DeliveryAgentType.Independent;

        public int? MerchantUserId { get; set; }
        public User? MerchantUser { get; set; }

        public int? DeliveryOfficeId { get; set; }
        public DeliveryOffice? DeliveryOffice { get; set; }

        public string? Phone { get; set; }
        public string? VehicleType { get; set; }

        public bool IsActive { get; set; } = true;
        public bool IsAvailable { get; set; } = false;

        public decimal? CommissionPercent { get; set; }

        public decimal? LastLat { get; set; }
        public decimal? LastLng { get; set; }
        public DateTime? LastLocationAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
