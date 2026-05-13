namespace CityOrders.Api.Domain.Entities
{
    public class CustomerProfile
    {
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public bool IsActive { get; set; } = true;
        
        // Navigation property for addresses
        public ICollection<CustomerAddress> Addresses { get; set; } = new List<CustomerAddress>();
    }
}
