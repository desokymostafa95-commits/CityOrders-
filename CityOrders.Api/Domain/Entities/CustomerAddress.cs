namespace CityOrders.Api.Domain.Entities
{
    public class CustomerAddress
    {
        public int Id { get; set; }
        
        public int CustomerUserId { get; set; }
        // Navigation could be to User or CustomerProfile. 
        // Let's map to CustomerProfile to enforce it belongs to a customer.
        public CustomerProfile CustomerProfile { get; set; } = null!;

        public string AddressLine { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public bool IsDefault { get; set; } = false;
        
        // Geo coordinates for delivery calculation
        public decimal? Lat { get; set; }
        public decimal? Lng { get; set; }
    }
}
