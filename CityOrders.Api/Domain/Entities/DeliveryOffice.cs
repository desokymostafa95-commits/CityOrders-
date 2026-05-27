namespace CityOrders.Api.Domain.Entities
{
    public class DeliveryOffice
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }

        public int ManagerUserId { get; set; }
        public User ManagerUser { get; set; } = null!;

        public decimal DefaultCommissionPercent { get; set; }
        public int AgentCollectionCycleDays { get; set; } = 7;
        public string AgentCollectionMethodsJson { get; set; } = "[\"Cash\",\"Instapay\",\"COD\"]";
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<DeliveryProfile> DeliveryAgents { get; set; } = new List<DeliveryProfile>();
    }
}
