namespace CityOrders.Api.Domain.Entities
{
    public class ProductPhoto
    {
        public int Id { get; set; }
        
        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;

        public string Url { get; set; } = string.Empty;
        public bool IsPrimary { get; set; } = false;
    }
}
