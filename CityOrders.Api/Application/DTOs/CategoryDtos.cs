using System.ComponentModel.DataAnnotations;

namespace CityOrders.Api.Application.DTOs
{
    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }
        public int ProductsCount { get; set; }
    }

    public class CreateCategoryDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? Description { get; set; }
        
        public int SortOrder { get; set; } = 0;
    }

    public class UpdateCategoryDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? Description { get; set; }
        
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }
    }

    public class CategoryReorderDto
    {
        public int Id { get; set; }
        public int SortOrder { get; set; }
    }
}
