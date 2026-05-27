using System;
using System.ComponentModel.DataAnnotations;

namespace CityOrders.Api.Application.DTOs
{
    public class CreateBrandReviewDto
    {
        [Range(1, 5)]
        public int Rating { get; set; }

        [MaxLength(500)]
        public string? Comment { get; set; }
    }

    public class BrandReviewDto
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public int BrandId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
