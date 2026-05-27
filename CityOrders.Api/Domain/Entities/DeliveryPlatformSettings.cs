namespace CityOrders.Api.Domain.Entities
{
    public class DeliveryPlatformSettings
    {
        public int Id { get; set; }
        public decimal IndependentPlatformCommissionPercent { get; set; } = 0;
        public int IndependentCollectionCycleDays { get; set; } = 7;
        public string IndependentCollectionMethodsJson { get; set; } = "[\"Cash\",\"Instapay\",\"COD\"]";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
