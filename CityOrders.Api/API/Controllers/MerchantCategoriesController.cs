using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using CityOrders.Api.API.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CityOrders.Api.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Merchant")]
    [Tags("Merchant - Categories")]
    public class MerchantCategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MerchantCategoriesController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (idClaim == null) throw new UnauthorizedAccessException();
            return int.Parse(idClaim.Value);
        }

        private async Task<Brand?> GetMyBrand(int userId)
        {
            return await _context.Brands.FirstOrDefaultAsync(b => b.MerchantUserId == userId);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories()
        {
            var userId = GetUserId();
            var brand = await GetMyBrand(userId);
            if (brand == null) return NotFound("Brand not found.");

            var categories = await _context.BrandCategories
                .Where(bc => bc.BrandId == brand.Id)
                .OrderBy(bc => bc.SortOrder)
                .Select(bc => new CategoryDto
                {
                    Id = bc.Id,
                    Name = bc.Name,
                    Description = bc.Description,
                    SortOrder = bc.SortOrder,
                    IsActive = bc.IsActive,
                    ProductsCount = bc.Products.Count
                })
                .ToListAsync();

            return Ok(categories);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCategory(CreateCategoryDto dto)
        {
            var userId = GetUserId();
            var brand = await GetMyBrand(userId);
            if (brand == null) return BadRequest("Brand not found.");

            if (await _context.BrandCategories.AnyAsync(bc => bc.BrandId == brand.Id && bc.Name == dto.Name))
                return BadRequest("Category with this name already exists for your brand.");

            var category = new BrandCategory
            {
                BrandId = brand.Id,
                Name = dto.Name,
                Description = dto.Description,
                SortOrder = dto.SortOrder,
                IsActive = true
            };

            _context.BrandCategories.Add(category);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Category created.", categoryId = category.Id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(int id, UpdateCategoryDto dto)
        {
            var userId = GetUserId();
            var brand = await GetMyBrand(userId);
            if (brand == null) return BadRequest("Brand not found.");

            var category = await _context.BrandCategories
                .FirstOrDefaultAsync(bc => bc.Id == id && bc.BrandId == brand.Id);

            if (category == null) return NotFound();

            // Check name uniqueness if changed
            if (category.Name != dto.Name && await _context.BrandCategories.AnyAsync(bc => bc.BrandId == brand.Id && bc.Name == dto.Name))
                return BadRequest("Category with this name already exists.");

            category.Name = dto.Name;
            category.Description = dto.Description;
            category.SortOrder = dto.SortOrder;
            category.IsActive = dto.IsActive;
            category.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Category updated." });
        }

        [HttpDelete("{id}")]
        [ProducesResponseType(204)]
        [ProducesResponseType(409)]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var userId = GetUserId();
            var brand = await GetMyBrand(userId);
            if (brand == null) return BadRequest("Brand not found.");

            var category = await _context.BrandCategories
                .Include(bc => bc.Products.Where(p => !p.IsDeleted))
                .FirstOrDefaultAsync(bc => bc.Id == id && bc.BrandId == brand.Id);

            if (category == null) return NotFound();

            // Check if category has active products
            var activeProductsCount = category.Products.Count;
            if (activeProductsCount > 0)
            {
                return Conflict(new { 
                    message = "Cannot delete category with products. Move or delete products first.",
                    productsCount = activeProductsCount
                });
            }

            _context.BrandCategories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }


        [HttpPut("reorder")]
        public async Task<IActionResult> ReorderCategories(List<CategoryReorderDto> dto)
        {
            var userId = GetUserId();
            var brand = await GetMyBrand(userId);
            if (brand == null) return BadRequest("Brand not found.");

            var categoryIds = dto.Select(d => d.Id).ToList();
            var categories = await _context.BrandCategories
                .Where(bc => bc.BrandId == brand.Id && categoryIds.Contains(bc.Id))
                .ToListAsync();

            foreach (var item in dto)
            {
                var cat = categories.FirstOrDefault(c => c.Id == item.Id);
                if (cat != null)
                {
                    cat.SortOrder = item.SortOrder;
                    cat.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Categories reordered." });
        }
    }
}
