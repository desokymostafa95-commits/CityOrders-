namespace CityOrders.Api.Domain.Entities
{
    public class DeliveryProfile
    {
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public bool IsActive { get; set; } = true;
    }
}
