using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CityOrders.Api.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("register/customer")]
        public async Task<IActionResult> RegisterCustomer([FromBody] RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Email already exists.");

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = PasswordHasher.HashPassword(dto.Password),
                IsActive = true
            };

            var customerRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Customer");
            if (customerRole == null) return StatusCode(500, "Role not found.");

            user.UserRoles.Add(new UserRole { Role = customerRole });
            
            // Add Profile
            user.CustomerProfile = new CustomerProfile { IsActive = true };
            
            // Add Address if provided
            if (!string.IsNullOrEmpty(dto.AddressLine))
            {
                user.CustomerProfile.Addresses.Add(new CustomerAddress
                {
                    AddressLine = dto.AddressLine,
                    IsDefault = true,
                    Lat = dto.Lat,
                    Lng = dto.Lng
                });
            }

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Generate JWT token for immediate login
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Role, "Customer")
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: creds
            );

            return Ok(new AuthResponseDto
            {
                UserId = user.Id,
                Name = user.Name,
                Email = user.Email,
                Roles = new List<string> { "Customer" },
                Token = new JwtSecurityTokenHandler().WriteToken(token)
            });
        }


        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Include(u => u.MerchantProfile)
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null || !PasswordHasher.VerifyPassword(dto.Password, user.PasswordHash))
                return Unauthorized("Invalid email or password.");

            if (!user.IsActive) return Unauthorized("Account is inactive.");

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name)
            };

            var roleEntities = user.UserRoles.Select(ur => ur.Role).ToList();
            var roles = roleEntities.Select(r => r.Name).ToList();
            var hasAdminAccess = roles.Contains("Admin") ||
                                 roleEntities.Any(r => r.IsCustom && r.Permissions != "[]");
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
            if (hasAdminAccess && !roles.Contains("Admin"))
            {
                claims.Add(new Claim(ClaimTypes.Role, "Admin"));
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

            bool? needsApproval = null;
            if (roles.Contains("Merchant"))
            {
                // Account needs approval if the profile exists and is NOT yet approved
                needsApproval = user.MerchantProfile != null && !user.MerchantProfile.IsApproved;
            }

            return new AuthResponseDto
            {
                UserId = user.Id,
                Name = user.Name,
                Email = user.Email,
                Roles = hasAdminAccess && !roles.Contains("Admin") ? roles.Append("Admin").ToList() : roles,
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                NeedsApproval = needsApproval
            };
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
                return Unauthorized("User not identified.");

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found.");

            if (!PasswordHasher.VerifyPassword(dto.CurrentPassword, user.PasswordHash))
                return BadRequest("Incorrect current password.");

            user.PasswordHash = PasswordHasher.HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();

            return Ok("Password changed successfully.");
        }
    }
}
