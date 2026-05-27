namespace CityOrders.Api.Domain.Entities
{
    public class OrderItem
    {
        public int Id { get; set; }
        
        public int OrderId { get; set; }
        public Order Order { get; set; } = null!;

        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;

        public string ProductNameSnapshot { get; set; } = string.Empty;
        public decimal UnitPriceSnapshot { get; set; }
        public decimal Quantity { get; set; }
        public decimal LineTotal { get; set; }
    }
}
