using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace CityOrders.Api.API.Controllers
{
    [Route("api/admin/categories")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    [Tags("Admin - Categories")]
    public class AdminCategoryController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public AdminCategoryController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet("icon-keys")]
        public ActionResult<string[]> GetIconKeys()
        {
             // Deprecated but kept for backward compatibility if needed, returns empty or default
            return Ok(Array.Empty<string>());
        }

        [HttpGet("sectors")]
        public async Task<ActionResult<IEnumerable<AdminMarketSectorDto>>> GetSectors([FromQuery] bool includeInactive = true)
        {
            var query = _context.MarketSectors
                .Include(s => s.Categories)
                .AsQueryable();

            if (!includeInactive)
                query = query.Where(s => s.IsActive);

            var sectors = await query
                .OrderBy(s => s.SortOrder)
                .ThenBy(s => s.Name)
                .Select(s => new AdminMarketSectorDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Slug = s.Slug,
                    Description = s.Description,
                    IconKey = s.IconKey,
                    ImageUrl = s.ImageUrl,
                    SortOrder = s.SortOrder,
                    IsActive = s.IsActive,
                    CategoriesCount = s.Categories.Count,
                    CreatedAt = s.CreatedAt
                })
                .ToListAsync();

            return Ok(sectors);
        }

        [HttpPost("sectors")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<AdminMarketSectorDto>> CreateSector([FromForm] CreateAdminMarketSectorDto dto)
        {
            var slug = GenerateSlug(dto.Name);
            if (await _context.MarketSectors.AnyAsync(s => s.Name == dto.Name || s.Slug == slug))
                return Conflict("Sector with this name already exists.");

            var sector = new MarketSector
            {
                Name = dto.Name,
                Slug = slug,
                Description = dto.Description,
                IconKey = dto.IconKey,
                ImageUrl = dto.Image != null ? await SaveImage(dto.Image, "sectors") : null,
                SortOrder = dto.SortOrder,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.MarketSectors.Add(sector);
            await _context.SaveChangesAsync();

            return Ok(ToSectorDto(sector, 0));
        }

        [HttpPut("sectors/{id}")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<AdminMarketSectorDto>> UpdateSector(int id, [FromForm] UpdateAdminMarketSectorDto dto)
        {
            var sector = await _context.MarketSectors
                .Include(s => s.Categories)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (sector == null) return NotFound();

            if (sector.Name != dto.Name)
            {
                var newSlug = GenerateSlug(dto.Name);
                if (await _context.MarketSectors.AnyAsync(s => (s.Name == dto.Name || s.Slug == newSlug) && s.Id != id))
                    return Conflict("Sector with this name already exists.");
                sector.Slug = newSlug;
            }

            sector.Name = dto.Name;
            sector.Description = dto.Description;
            sector.IconKey = dto.IconKey;
            sector.SortOrder = dto.SortOrder;
            sector.IsActive = dto.IsActive;
            sector.UpdatedAt = DateTime.UtcNow;
            if (dto.Image != null)
                sector.ImageUrl = await SaveImage(dto.Image, "sectors");

            await _context.SaveChangesAsync();
            return Ok(ToSectorDto(sector, sector.Categories.Count));
        }

        [HttpPatch("sectors/{id}/toggle")]
        public async Task<IActionResult> ToggleSector(int id)
        {
            var sector = await _context.MarketSectors.FindAsync(id);
            if (sector == null) return NotFound();

            sector.IsActive = !sector.IsActive;
            sector.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { isActive = sector.IsActive });
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AdminCategoryDto>>> GetCategories(
            [FromQuery] bool includeInactive = true,
            [FromQuery] string? search = null,
            [FromQuery] string sort = "sortOrder",
            [FromQuery] int? marketSectorId = null,
            [FromQuery] string? sector = null)
        {
            // Auto-repair empty slugs
            var emptySlugs = await _context.Categories.Where(c => c.Slug == "").ToListAsync();
            if (emptySlugs.Any())
            {
                foreach (var c in emptySlugs)
                {
                    c.Slug = GenerateSlug(c.Name);
                    if (string.IsNullOrEmpty(c.Slug)) c.Slug = Guid.NewGuid().ToString("n").Substring(0, 8);
                }
                await _context.SaveChangesAsync();
            }

            var query = _context.Categories
                .Include(c => c.MarketSector)
                .AsQueryable();

            if (!includeInactive)
                query = query.Where(c => c.IsActive);

            if (marketSectorId.HasValue)
                query = query.Where(c => c.MarketSectorId == marketSectorId.Value);

            if (!string.IsNullOrWhiteSpace(sector))
                query = query.Where(c => c.MarketSector.Slug == sector || c.MarketSector.Name == sector);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(c => c.Name.Contains(search) || (c.Description != null && c.Description.Contains(search)));

            if (sort.ToLower() == "name")
                query = query.OrderBy(c => c.Name);
            else
                query = query.OrderBy(c => c.SortOrder).ThenBy(c => c.Name);

            var categories = await query.Select(c => new AdminCategoryDto
            {
                Id = c.Id,
                MarketSectorId = c.MarketSectorId,
                MarketSectorName = c.MarketSector.Name,
                MarketSectorSlug = c.MarketSector.Slug,
                Name = c.Name,
                Slug = c.Slug,
                Description = c.Description,
                ImageUrl = c.ImageUrl,
                SortOrder = c.SortOrder,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt
            }).ToListAsync();

            return Ok(categories);
        }

        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<AdminCategoryDto>> CreateCategory([FromForm] CreateAdminCategoryDto dto)
        {
            var sector = await _context.MarketSectors.FindAsync(dto.MarketSectorId);
            if (sector == null) return BadRequest("Market sector does not exist.");

            var slug = GenerateSlug(dto.Name);

            var existingByName = await _context.Categories.FirstOrDefaultAsync(c => c.Name == dto.Name);
            if (existingByName != null)
                return Conflict("Category with this name already exists.");

            var existingBySlug = await _context.Categories.FirstOrDefaultAsync(c => c.Slug == slug);
            if (existingBySlug != null)
                return Conflict($"Internal Conflict: Category with ID/Slug similar to '{slug}' already exists (Matches: {existingBySlug.Name}).");

            string? imageUrl = null;
            if (dto.Image != null)
            {
                imageUrl = await SaveImage(dto.Image);
            }

            var category = new Category
            {
                Name = dto.Name,
                Slug = slug,
                MarketSectorId = dto.MarketSectorId,
                Description = dto.Description,
                ImageUrl = imageUrl,
                SortOrder = dto.SortOrder,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategories), new { id = category.Id }, new AdminCategoryDto
            {
                Id = category.Id,
                MarketSectorId = category.MarketSectorId,
                MarketSectorName = sector.Name,
                MarketSectorSlug = sector.Slug,
                Name = category.Name,
                Slug = category.Slug,
                Description = category.Description,
                ImageUrl = category.ImageUrl,
                SortOrder = category.SortOrder,
                IsActive = category.IsActive,
                CreatedAt = category.CreatedAt
            });
        }

        [HttpPut("{id}")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<AdminCategoryDto>> UpdateCategory(int id, [FromForm] UpdateAdminCategoryDto dto)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null) return NotFound();
            var sector = await _context.MarketSectors.FindAsync(dto.MarketSectorId);
            if (sector == null) return BadRequest("Market sector does not exist.");

            // Check slug if name changed
            if (category.Name != dto.Name)
            {
                var newSlug = GenerateSlug(dto.Name);
                if (await _context.Categories.AnyAsync(c => (c.Name == dto.Name || c.Slug == newSlug) && c.Id != id))
                    return Conflict("Category with this name already exists.");
                category.Slug = newSlug;
            }

            if (dto.Image != null)
            {
                category.ImageUrl = await SaveImage(dto.Image);
            }

            category.Name = dto.Name;
            category.MarketSectorId = dto.MarketSectorId;
            category.Description = dto.Description;
            category.SortOrder = dto.SortOrder;
            category.IsActive = dto.IsActive;
            category.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new AdminCategoryDto
            {
                Id = category.Id,
                MarketSectorId = category.MarketSectorId,
                MarketSectorName = sector.Name,
                MarketSectorSlug = sector.Slug,
                Name = category.Name,
                Slug = category.Slug,
                Description = category.Description,
                ImageUrl = category.ImageUrl,
                SortOrder = category.SortOrder,
                IsActive = category.IsActive,
                CreatedAt = category.CreatedAt
            });
        }

        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> ToggleActive(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null) return NotFound();

            category.IsActive = !category.IsActive;
            category.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { isActive = category.IsActive });
        }

        [HttpPut("reorder")]
        public async Task<IActionResult> ReorderCategories(List<ReorderAdminCategoryDto> reorderList)
        {
            foreach (var item in reorderList)
            {
                var category = await _context.Categories.FindAsync(item.Id);
                if (category != null)
                {
                    category.SortOrder = item.SortOrder;
                }
            }
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null) return NotFound();

            // Delete associated image if it exists
            if (!string.IsNullOrEmpty(category.ImageUrl))
            {
                try
                {
                    var imagePath = Path.Combine(_env.ContentRootPath, category.ImageUrl.TrimStart('/'));
                    if (System.IO.File.Exists(imagePath))
                    {
                        System.IO.File.Delete(imagePath);
                    }
                }
                catch (Exception ex)
                {
                    // Log the error but don't fail the deletion
                    Console.WriteLine($"Error deleting image for category {id}: {ex.Message}");
                }
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Category deleted successfully." });
        }

        private string GenerateSlug(string name)
        {
            string str = name.ToLowerInvariant();
            // Remove invalid chars but keep Unicode word characters and spaces
            str = Regex.Replace(str, @"[^\w\s-]", "");
            // Convert multiple spaces into one space   
            str = Regex.Replace(str, @"\s+", " ").Trim();
            // cut and trim 
            str = str.Substring(0, Math.Min(str.Length, 45)).Trim();
            str = Regex.Replace(str, @"\s", "-"); // hyphens   

            // Fallback for empty slugs (e.g. if name only contained removed symbols)
            if (string.IsNullOrWhiteSpace(str))
                return Guid.NewGuid().ToString("N").Substring(0, 8);

            return str;
        }
        private AdminMarketSectorDto ToSectorDto(MarketSector sector, int categoriesCount)
        {
            return new AdminMarketSectorDto
            {
                Id = sector.Id,
                Name = sector.Name,
                Slug = sector.Slug,
                Description = sector.Description,
                IconKey = sector.IconKey,
                ImageUrl = sector.ImageUrl,
                SortOrder = sector.SortOrder,
                IsActive = sector.IsActive,
                CategoriesCount = categoriesCount,
                CreatedAt = sector.CreatedAt
            };
        }

        private async Task<string> SaveImage(IFormFile image, string folder = "categories")
        {
            // Use ContentRootPath to match Program.cs StaticFile configuration
            var uploadsDir = Path.Combine(_env.ContentRootPath, "uploads", folder);
            Console.WriteLine($"[DEBUG] Saving image to: {uploadsDir}");
            
            if (!Directory.Exists(uploadsDir))
                Directory.CreateDirectory(uploadsDir);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(image.FileName).ToLowerInvariant()}";
            var filePath = Path.Combine(uploadsDir, fileName);
            Console.WriteLine($"[DEBUG] Full file path: {filePath}");

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await image.CopyToAsync(stream);
            }

            return $"/uploads/{folder}/{fileName}";
        }
    }
}
