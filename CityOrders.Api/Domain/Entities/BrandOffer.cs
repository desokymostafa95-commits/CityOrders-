using System;

namespace CityOrders.Api.Domain.Entities
{
    public class BrandOffer
    {
        public int Id { get; set; }
        
        public int BrandId { get; set; }
        public Brand Brand { get; set; } = null!;

        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;

        public decimal OfferPrice { get; set; }
        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
