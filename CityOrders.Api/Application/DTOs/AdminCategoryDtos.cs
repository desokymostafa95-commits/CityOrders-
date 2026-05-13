using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace CityOrders.Api.Application.DTOs
{
    public class AdminCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateAdminCategoryDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        public IFormFile? Image { get; set; }

        public int SortOrder { get; set; } = 0;

        public bool IsActive { get; set; } = true;
    }

    public class UpdateAdminCategoryDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        public IFormFile? Image { get; set; }

        public int SortOrder { get; set; }

        public bool IsActive { get; set; }
    }

    public class ReorderAdminCategoryDto
    {
        public int Id { get; set; }
        public int SortOrder { get; set; }
    }
}
