using System.ComponentModel.DataAnnotations;

namespace CityOrders.Api.Domain.Entities
{
    public class MarketSector
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(120)]
        public string Slug { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(80)]
        public string? IconKey { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Category> Categories { get; set; } = new List<Category>();
        public ICollection<Brand> Brands { get; set; } = new List<Brand>();
    }
}
