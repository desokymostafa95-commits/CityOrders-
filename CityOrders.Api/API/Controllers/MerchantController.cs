using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using CityOrders.Api.API.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace CityOrders.Api.API.Controllers
{
    [Route("api/merchant")]
    [ApiController]
    [Authorize]
    public class MerchantController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<MerchantController> _logger;

        public MerchantController(AppDbContext context, IConfiguration configuration, IWebHostEnvironment env, ILogger<MerchantController> logger)
        {
            _context = context;
            _configuration = configuration;
            _env = env;
            _logger = logger;
        }

        [HttpGet("test")]
        public IActionResult Test() => Ok("Merchant Root Reachable");

        private int GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (idClaim == null) return 0; // Or handle as needed
            return int.Parse(idClaim.Value);
        }

        private async Task<bool> IsApprovedMerchant(int userId)
        {
            var mp = await _context.MerchantProfiles.FirstOrDefaultAsync(m => m.UserId == userId);
            return mp != null && mp.IsApproved && mp.IsActive;
        }

        private async Task<bool> IsActiveMerchant(int userId)
        {
            var mp = await _context.MerchantProfiles.FirstOrDefaultAsync(m => m.UserId == userId);
            return mp != null && mp.IsActive;
        }

        [HttpPost("apply-anon")]
        [AllowAnonymous]
        [Obsolete("Use POST /api/Merchant/apply with authentication instead.")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(typeof(string), 400)]
        public async Task<IActionResult> ApplyAnon([FromBody] ApplyMerchantDto dto)
        {
            // Check if user exists
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .Include(u => u.MerchantProfile)
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user != null)
            {
                if (!PasswordHasher.VerifyPassword(dto.Password, user.PasswordHash))
                    return Unauthorized("User exists but password does not match.");

                if (user.MerchantProfile != null)
                    return BadRequest("User is already a merchant (or has applied).");

                var merchantRole = await _context.Roles.FirstAsync(r => r.Name == "Merchant");
                if (user.UserRoles.All(ur => ur.RoleId != merchantRole.Id))
                {
                    user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = merchantRole.Id });
                }

                user.MerchantProfile = new MerchantProfile
                {
                    UserId = user.Id,
                    IsApproved = false, // Explicitly false, requires admin approval
                    IsActive = true
                };
                // Don't save yet, wait for brand check
            }
            else
            {
                user = new User
                {
                    Name = dto.Name,
                    Email = dto.Email,
                    PasswordHash = PasswordHasher.HashPassword(dto.Password),
                    IsActive = true
                };
                var merchantRole = await _context.Roles.FirstAsync(r => r.Name == "Merchant");
                user.UserRoles.Add(new UserRole { Role = merchantRole }); // Will fixup on save
                user.MerchantProfile = new MerchantProfile { IsApproved = false, IsActive = true };
                _context.Users.Add(user);
            }

            // Save user first to get ID
            await _context.SaveChangesAsync();
            Console.WriteLine($"[Merchant Registration] New merchant user {user.Id} ({user.Email}) created. Profile pending approval.");

            // Create Brand
            var existingBrand = await _context.Brands.FirstOrDefaultAsync(b => b.MerchantUserId == user.Id);
            if (existingBrand != null) return BadRequest("Merchant already has a brand.");

            var brand = new Brand
            {
                MerchantUserId = user.Id,
                Name = dto.BrandName,
                Address = dto.BrandAddress,
                Phone1 = dto.BrandPhone,
                IsActive = true
            };
            _context.Brands.Add(brand);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Application submitted (Legacy Flow)." });
        }

        /// <summary>
        /// Apply to become a merchant (Authenticated).
        /// </summary>
        [HttpPost("apply")]
        [Authorize]
        public async Task<IActionResult> Apply([FromBody] ApplyMerchantLoggedInDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Include(u => u.MerchantProfile)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return Unauthorized();

            if (user.MerchantProfile != null)
                return BadRequest("You are already a merchant or have applied.");

            // 1. Add Role if missing
            var merchantRole = await _context.Roles.FirstAsync(r => r.Name == "Merchant");
            if (user.UserRoles.All(ur => ur.RoleId != merchantRole.Id))
            {
                user.UserRoles.Add(new UserRole { UserId = userId, RoleId = merchantRole.Id, Role = merchantRole });
            }

            // 2. Create Profile
            var profile = new MerchantProfile
            {
                UserId = userId,
                IsApproved = false, // Explicitly false, requires admin approval
                IsActive = true,
                ApprovalRequestReason = "Initial brand application"
            };
            _context.MerchantProfiles.Add(profile);

            // 3. Create Brand (One per merchant)
            var existingBrand = await _context.Brands.FirstOrDefaultAsync(b => b.MerchantUserId == userId);
            if (existingBrand != null) return BadRequest("Merchant already has a brand.");

            var brand = new Brand
            {
                MerchantUserId = userId,
                Name = dto.BrandName,
                Address = dto.BrandAddress,
                Phone1 = dto.BrandPhone,
                FixedDeliveryFee = dto.FixedDeliveryFee,
                MinVariableDeliveryFee = dto.MinVariableDeliveryFee,
                MaxVariableDeliveryFee = dto.MaxVariableDeliveryFee,
                DeliveryFeeType = dto.DeliveryFeeType ?? "Fixed",
                IsActive = true
            };

            if (dto.MasterCategoryIds != null && dto.MasterCategoryIds.Any())
            {
                var categories = await _context.Categories
                    .Where(c => dto.MasterCategoryIds.Contains(c.Id))
                    .ToListAsync();
                foreach (var cat in categories) brand.MasterCategories.Add(cat);
            }

            _context.Brands.Add(brand);

            // 4. (REMOVED) Trial is now manual activation.
            
            await _context.SaveChangesAsync();
            Console.WriteLine($"[Merchant Application] User {userId} applied for merchant profile. Status: Pending Approval.");

            // 5. Generate Fresh Token with New Roles
            var roles = await _context.UserRoles
                .Where(ur => ur.UserId == user.Id)
                .Select(ur => ur.Role.Name)
                .ToListAsync();
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name)
            };
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: creds
            );

            return Ok(new { 
                message = "Application submitted. Wait for admin approval. You can setup your store now.",
                token = new JwtSecurityTokenHandler().WriteToken(token),
                roles = roles,
                trialAvailable = true
            });
        }


        [HttpGet("brand")]
        [Authorize(Roles = "Merchant")]
        public async Task<ActionResult<BrandDto>> GetMyBrand()
        {
            var userId = GetUserId();
            var brand = await _context.Brands
                .Include(b => b.MasterCategories)
                .FirstOrDefaultAsync(b => b.MerchantUserId == userId);
            
            if (brand == null) return NotFound("No brand found.");

            return new BrandDto
            {
                Id = brand.Id,
                Name = brand.Name,
                Address = brand.Address,
                Phone1 = brand.Phone1,
                IsActive = brand.IsActive,
                FixedDeliveryFee = brand.FixedDeliveryFee,
                MinVariableDeliveryFee = brand.MinVariableDeliveryFee,
                MaxVariableDeliveryFee = brand.MaxVariableDeliveryFee,
                DeliveryFeeType = brand.DeliveryFeeType,
                LogoUrl = brand.LogoUrl,
                MasterCategoryIds = brand.MasterCategories.Select(c => c.Id).ToList(),
                MasterCategories = brand.MasterCategories.Select(c => new AdminCategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Slug = c.Slug,
                    Description = c.Description,
                    ImageUrl = c.ImageUrl,
                    SortOrder = c.SortOrder,
                    IsActive = c.IsActive
                }).ToList()
            };
        }

        [HttpPut("brand")]
        [Authorize(Roles = "Merchant")]
        public async Task<IActionResult> UpdateBrand(BrandDto dto)
        {
            var userId = GetUserId();
            if (!await IsActiveMerchant(userId)) return StatusCode(403, "Merchant account is inactive.");

            var brand = await _context.Brands
                .Include(b => b.MasterCategories)
                .Include(b => b.MerchantProfile)
                .FirstOrDefaultAsync(b => b.MerchantUserId == userId);
            
            if (brand == null) return NotFound();

            // Check if categories changed
            if (dto.MasterCategoryIds != null)
            {
                var currentIds = brand.MasterCategories.Select(c => c.Id).ToList();
                var newIds = dto.MasterCategoryIds;
                
                bool changed = currentIds.Count != newIds.Count || currentIds.Except(newIds).Any() || newIds.Except(currentIds).Any();
                
                if (changed)
                {
                    var added = newIds.Except(currentIds).ToList();
                    var removed = currentIds.Except(newIds).ToList();
                    
                    var addedNames = await _context.Categories.Where(c => added.Contains(c.Id)).Select(c => c.Name).ToListAsync();
                    var removedNames = await _context.Categories.Where(c => removed.Contains(c.Id)).Select(c => c.Name).ToListAsync();
                    
                    string reason = "Category update: ";
                    if (addedNames.Any()) reason += $"Added [{string.Join(", ", addedNames)}] ";
                    if (removedNames.Any()) reason += $"Removed [{string.Join(", ", removedNames)}]";

                    if (brand.MerchantProfile != null)
                    {
                        brand.MerchantProfile.IsApproved = false;
                        brand.MerchantProfile.ApprovalRequestReason = reason.Trim();
                        brand.MerchantProfile.RejectionReason = null;
                        brand.MerchantProfile.UpdatedAt = DateTime.UtcNow;
                        Console.WriteLine($"[Merchant Category Update] User {userId} changed categories. Reason: {reason}");
                    }
                    
                    brand.MasterCategories.Clear();
                    var categories = await _context.Categories
                        .Where(c => dto.MasterCategoryIds.Contains(c.Id))
                        .ToListAsync();
                    foreach (var cat in categories) brand.MasterCategories.Add(cat);
                }
            }

            brand.Name = dto.Name;
            brand.Address = dto.Address;
            brand.Phone1 = dto.Phone1;
            brand.FixedDeliveryFee = dto.FixedDeliveryFee;
            brand.MinVariableDeliveryFee = dto.MinVariableDeliveryFee;
            brand.MaxVariableDeliveryFee = dto.MaxVariableDeliveryFee;
            brand.DeliveryFeeType = dto.DeliveryFeeType ?? "Fixed";
            
            await _context.SaveChangesAsync();
            return Ok(new BrandDto
            {
                Id = brand.Id,
                Name = brand.Name,
                Address = brand.Address,
                Phone1 = brand.Phone1,
                IsActive = brand.IsActive,
                FixedDeliveryFee = brand.FixedDeliveryFee,
                MinVariableDeliveryFee = brand.MinVariableDeliveryFee,
                MaxVariableDeliveryFee = brand.MaxVariableDeliveryFee,
                DeliveryFeeType = brand.DeliveryFeeType,
                LogoUrl = brand.LogoUrl,
                MasterCategoryIds = brand.MasterCategories.Select(c => c.Id).ToList()
            });
        }

        [HttpPost("brand/logo")]
        [Authorize(Roles = "Merchant")]
        [Consumes("multipart/form-data")]
        [Tags("Merchant - Brand")]
        public async Task<IActionResult> UploadLogo(IFormFile logo)
        {
            if (logo == null || logo.Length == 0) return BadRequest("No file uploaded.");
            
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(logo.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
                return BadRequest("Invalid file type. Allowed: JPG, PNG, WEBP.");

            var userId = GetUserId();
            var brand = await _context.Brands.FirstOrDefaultAsync(b => b.MerchantUserId == userId);
            if (brand == null) return NotFound("Brand not found.");

            // Create directory
            var uploadsDir = Path.Combine(_env.ContentRootPath, "uploads", "brands");
            if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);

            // Generate filename
            var fileName = $"logo_{brand.Id}_{Guid.NewGuid():N}{extension}";
            var filePath = Path.Combine(uploadsDir, fileName);

            // Delete old logo if exists
            if (!string.IsNullOrEmpty(brand.LogoUrl))
            {
                try
                {
                    var oldFilePath = Path.Combine(_env.ContentRootPath, brand.LogoUrl.TrimStart('/'));
                    if (System.IO.File.Exists(oldFilePath)) System.IO.File.Delete(oldFilePath);
                }
                catch (Exception ex) { _logger.LogWarning(ex, "Failed to delete old logo for brand {BrandId}", brand.Id); }
            }

            // Save new file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await logo.CopyToAsync(stream);
            }

            brand.LogoUrl = $"/uploads/brands/{fileName}";
            await _context.SaveChangesAsync();

            return Ok(new { logoUrl = brand.LogoUrl });
        }
        
        [HttpGet("brand/location")]
        [Authorize(Roles = "Merchant")]
        [Tags("Merchant - Brand")]
        public async Task<ActionResult<MerchantStoreLocationDto>> GetBrandLocation()
        {
            var userId = GetUserId();
            var brand = await _context.Brands.FirstOrDefaultAsync(b => b.MerchantUserId == userId);
            
            if (brand == null) return NotFound("Merchant has no brand yet.");
            
            return Ok(new MerchantStoreLocationDto
            {
                Lat = brand.LocationLat ?? 0,
                Lng = brand.LocationLng ?? 0,
                UpdatedAt = brand.LocationUpdatedAt
            });
        }

        [HttpPut("brand/location")]
        [Authorize(Roles = "Merchant")]
        [Tags("Merchant - Brand")]
        public async Task<ActionResult<MerchantStoreLocationDto>> UpdateBrandLocation([FromBody] MerchantStoreLocationDto dto)
        {
            if (dto.Lat < -90 || dto.Lat > 90) return BadRequest("Latitude must be between -90 and 90.");
            if (dto.Lng < -180 || dto.Lng > 180) return BadRequest("Longitude must be between -180 and 180.");

            var userId = GetUserId();
            if (!await IsActiveMerchant(userId)) return StatusCode(403, "Merchant account is inactive.");

            var brand = await _context.Brands.FirstOrDefaultAsync(b => b.MerchantUserId == userId);
            if (brand == null) return NotFound("Merchant has no brand yet.");

            brand.LocationLat = dto.Lat;
            brand.LocationLng = dto.Lng;
            brand.LocationUpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new MerchantStoreLocationDto
            {
                Lat = brand.LocationLat.Value,
                Lng = brand.LocationLng.Value,
                UpdatedAt = brand.LocationUpdatedAt
            });
        }

        [HttpGet("master-categories")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<AdminCategoryDto>>> GetMasterCategories()
        {
            var categories = await _context.Categories
                .Where(c => c.IsActive)
                .OrderBy(c => c.SortOrder)
                .Select(c => new AdminCategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Slug = c.Slug,
                    Description = c.Description,
                    ImageUrl = c.ImageUrl,
                    SortOrder = c.SortOrder,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            return Ok(categories);
        }

        // --- PRODUCT MANAGEMENT ---

        [HttpGet("products")]
        [Authorize(Roles = "Merchant")]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetMyProducts()
        {
            var userId = GetUserId();
            var brand = await _context.Brands
                .Include(b => b.Products.Where(p => !p.IsDeleted))
                    .ThenInclude(p => p.Photos)
                .Include(b => b.Products.Where(p => !p.IsDeleted))
                    .ThenInclude(p => p.Category)
                .FirstOrDefaultAsync(b => b.MerchantUserId == userId);
            
            if (brand == null) return NotFound("Brand not found.");

            return brand.Products.Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                IsActive = p.IsActive,
                CategoryId = p.CategoryId,
                CategoryName = p.Category?.Name,
                PrimaryImageUrl = p.Photos.FirstOrDefault(ph => ph.IsPrimary)?.Url,
                UnitType = p.UnitType,
                QuantityStep = p.QuantityStep,
                AllowFractionalQuantity = p.AllowFractionalQuantity
            }).ToList();
        }

        [HttpPost("products")]
        [Authorize(Roles = "Merchant")]
        public async Task<IActionResult> CreateProduct(CreateProductDto dto)
        {
            var userId = GetUserId();
            if (!await IsActiveMerchant(userId)) return StatusCode(403, "Merchant account is inactive.");

            var brand = await _context.Brands.FirstOrDefaultAsync(b => b.MerchantUserId == userId);
            if (brand == null) return BadRequest("Brand not found.");

            Console.WriteLine($"DEBUG: CreateProduct received - Name: {dto.Name}, Unit: {dto.UnitType}, Step: {dto.QuantityStep}, AllowFractional: {dto.AllowFractionalQuantity}");

            if (dto.CategoryId.HasValue)
            {
                var categoryExists = await _context.BrandCategories.AnyAsync(bc => bc.Id == dto.CategoryId && bc.BrandId == brand.Id);
                if (!categoryExists) return BadRequest("Invalid CategoryId. Category must belong to your brand.");
            }

            var product = new Product
            {
                BrandId = brand.Id,
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                CategoryId = dto.CategoryId,
                UnitType = dto.UnitType ?? "Unit",
                QuantityStep = dto.QuantityStep,
                AllowFractionalQuantity = dto.AllowFractionalQuantity,
                IsActive = true
            };

            if (!string.IsNullOrEmpty(dto.PhotoUrl))
                product.Photos.Add(new ProductPhoto { Url = dto.PhotoUrl, IsPrimary = true });

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Product created.", productId = product.Id });
        }

        [HttpPut("products/{id}")]
        [Authorize(Roles = "Merchant")]
        public async Task<IActionResult> UpdateProduct(int id, UpdateProductDto dto)
        {
            var userId = GetUserId();
            if (!await IsActiveMerchant(userId)) return StatusCode(403, "Merchant account is inactive.");

            var product = await _context.Products
                .Include(p => p.Brand)
                .FirstOrDefaultAsync(p => p.Id == id && p.Brand.MerchantUserId == userId && !p.IsDeleted);

            if (product == null) return NotFound();

            if (dto.CategoryId.HasValue)
            {
                var categoryExists = await _context.BrandCategories.AnyAsync(bc => bc.Id == dto.CategoryId && bc.BrandId == product.BrandId);
                if (!categoryExists) return BadRequest("Invalid CategoryId. Category must belong to your brand.");
            }

            Console.WriteLine($"DEBUG: UpdateProduct {id} received - Unit: {dto.UnitType}, Step: {dto.QuantityStep}, AllowFractional: {dto.AllowFractionalQuantity}");

            product.Name = dto.Name;
            product.Description = dto.Description;
            product.Price = dto.Price;
            product.CategoryId = dto.CategoryId;
            if (dto.IsActive.HasValue) product.IsActive = dto.IsActive.Value;
            if (dto.UnitType != null) product.UnitType = dto.UnitType;
            if (dto.QuantityStep.HasValue) product.QuantityStep = dto.QuantityStep.Value;
            if (dto.AllowFractionalQuantity.HasValue) product.AllowFractionalQuantity = dto.AllowFractionalQuantity.Value;
            
            if (!string.IsNullOrEmpty(dto.PhotoUrl))
            {
                product.Photos.Clear();
                product.Photos.Add(new ProductPhoto { Url = dto.PhotoUrl, IsPrimary = true });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Product updated." });
        }

        [HttpPatch("products/{id}/toggle")]
        [Authorize(Roles = "Merchant")]
        public async Task<IActionResult> ToggleProduct(int id)
        {
            var userId = GetUserId();
            if (!await IsActiveMerchant(userId)) return StatusCode(403, "Merchant account is inactive.");

            var product = await _context.Products
                .Include(p => p.Brand)
                .FirstOrDefaultAsync(p => p.Id == id && p.Brand.MerchantUserId == userId && !p.IsDeleted);

            if (product == null) return NotFound();

            product.IsActive = !product.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Product toggled.", isActive = product.IsActive });
        }

        [HttpDelete("products/{id}")]
        [Authorize(Roles = "Merchant")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var userId = GetUserId();
            if (!await IsActiveMerchant(userId)) return StatusCode(403, "Merchant account is inactive.");

            var product = await _context.Products
                .Include(p => p.Brand)
                .FirstOrDefaultAsync(p => p.Id == id && p.Brand.MerchantUserId == userId && !p.IsDeleted);

            if (product == null) return NotFound();

            // Soft delete
            product.IsDeleted = true;
            product.IsActive = false;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Product deleted." });
        }

        // --- ORDER MANAGEMENT ---

        [HttpGet("orders")]
        [Authorize(Roles = "Merchant")]
        [RequireActiveSubscription]
        public async Task<ActionResult<IEnumerable<dynamic>>> GetMyOrders([FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var userId = GetUserId();
            
            var query = _context.Orders
                .Include(o => o.Items)
                .Include(o => o.Brand) // To verify ownership
                .Where(o => o.Brand.MerchantUserId == userId);

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, true, out var statusEnum))
            {
                query = query.Where(o => o.Status == statusEnum);
            }

            var total = await query.CountAsync();
            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(o => new 
                {
                    o.Id,
                    o.OrderNumber,
                    Status = o.Status.ToString(),
                    o.Total,
                    o.CreatedAt,
                    ItemCount = o.Items.Sum(i => i.Quantity)
                })
                .ToListAsync();

            return Ok(new { page, pageSize, total, items = orders });
        }

        [HttpPut("orders/{id}/status")]
        [Authorize(Roles = "Merchant")]
        [RequireActiveSubscription]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromQuery] string action)
        {
            var userId = GetUserId();
            if (!await IsApprovedMerchant(userId)) return StatusCode(403, "Merchant not approved.");

            var order = await _context.Orders
                .Include(o => o.Brand)
                .FirstOrDefaultAsync(o => o.Id == id && o.Brand.MerchantUserId == userId);

            if (order == null) return NotFound();

            bool changed = false;
            switch (action.ToLower())
            {
                case "accept":
                    if (order.Status == OrderStatus.Pending) { order.Status = OrderStatus.Accepted; changed = true; }
                    break;
                case "prepare":
                    if (order.Status == OrderStatus.Accepted) { order.Status = OrderStatus.Preparing; changed = true; }
                    break;
                case "out-for-delivery":
                    if (order.Status == OrderStatus.Preparing) { order.Status = OrderStatus.OutForDelivery; changed = true; }
                    break;
                case "delivered":
                     if (order.Status == OrderStatus.OutForDelivery) 
                     { 
                         order.Status = OrderStatus.Delivered; 
                         order.DeliveredAt = DateTime.UtcNow;
                         changed = true; 
                     }
                    break;
                case "cancel":
                    if (order.Status != OrderStatus.Delivered && order.Status != OrderStatus.Cancelled)
                    {
                         order.Status = OrderStatus.Cancelled; 
                         changed = true;
                    }
                    break;
                default:
                    return BadRequest("Invalid action.");
            }

            if (changed)
            {
                order.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return Ok(new { message = $"Order status updated to {order.Status}." });
            }

            return BadRequest($"Cannot transition from {order.Status} via {action}.");
        }

        // Public Catalog Endpoint - Moved to CatalogController or kept as legacy redirect?
        // Requirement 2 said "improve public endpoint". But Requirement 4 says "Create CatalogController".
        // Let's keep it here for backward compat or just point to Catalog in docs.
        // I will implement the better logic here as requested in Task 2.
        [HttpGet("public/brand/{brandId}/products")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetPublicBrandProducts(int brandId)
        {
            var brand = await _context.Brands
                .Include(b => b.Products).ThenInclude(p => p.Photos)
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == brandId && b.IsActive);

            if (brand == null) return NotFound("Brand not found or inactive.");

            return brand.Products.Where(p => p.IsActive && !p.IsDeleted).Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                IsActive = p.IsActive,
                PrimaryImageUrl = p.Photos.FirstOrDefault(ph => ph.IsPrimary)?.Url,
                UnitType = p.UnitType,
                QuantityStep = p.QuantityStep,
                AllowFractionalQuantity = p.AllowFractionalQuantity
            }).ToList();
        }
        [HttpGet("profile")]
        public async Task<ActionResult<MerchantProfileDto>> GetProfile()
        {
            var userId = GetUserId();
            var user = await _context.Users
                .Include(u => u.MerchantProfile)
                    .ThenInclude(mp => mp.Brand)
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return Unauthorized();

            if (user.MerchantProfile == null)
            {
                return Ok(new MerchantProfileDto
                {
                    UserId = userId,
                    IsApproved = false,
                    IsActive = false,
                    HasBrand = false
                });
            }

            return Ok(new MerchantProfileDto
            {
                UserId = userId,
                IsApproved = user.MerchantProfile.IsApproved,
                IsActive = user.MerchantProfile.IsActive,
                HasBrand = user.MerchantProfile.Brand != null,
                BrandName = user.MerchantProfile.Brand?.Name
            });
        }
    }
}

