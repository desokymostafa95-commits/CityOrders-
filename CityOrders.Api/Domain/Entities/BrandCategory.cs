using System;
using System.Collections.Generic;

namespace CityOrders.Api.Domain.Entities
{
    public class BrandCategory
    {
        public int Id { get; set; }
        
        public int BrandId { get; set; }
        public Brand Brand { get; set; } = null!;

        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int SortOrder { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
