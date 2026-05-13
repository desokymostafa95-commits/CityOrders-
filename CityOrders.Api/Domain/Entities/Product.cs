using System.Collections.Generic;

namespace CityOrders.Api.Domain.Entities
{
    public class Product
    {
        public int Id { get; set; }
        
        public int BrandId { get; set; }
        public Brand Brand { get; set; } = null!;

        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;
        public string UnitType { get; set; } = "Unit"; // "Unit", "Kg", etc.
        public decimal QuantityStep { get; set; } = 1.0m;
        public bool AllowFractionalQuantity { get; set; } = false;

        public int? CategoryId { get; set; }
        public BrandCategory? Category { get; set; }

        public ICollection<ProductPhoto> Photos { get; set; } = new List<ProductPhoto>();
    }
}
