using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CityOrders.Api.API.Controllers
{
    [Route("api/admin/promos")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    [Tags("Admin - Promo Codes")]
    public class AdminPromoCodesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminPromoCodesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AdminPromoCodeDto>>> GetAllPromoCodes()
        {
            var promos = await _context.PromoCodes
                .Include(p => p.Brand)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var now = DateTime.UtcNow;

            var result = promos.Select(p => {
                string status = "Active";
                if (!p.IsActive) status = "Disabled";
                else if (p.ExpiresAt.HasValue && p.ExpiresAt.Value < now) status = "Expired";
                else if (p.StartsAt.HasValue && p.StartsAt.Value > now) status = "Scheduled";
                else if (p.UsageLimit.HasValue && p.UsageCount >= p.UsageLimit.Value) status = "Used Up";

                return new AdminPromoCodeDto
                {
                    Id = p.Id,
                    BrandId = p.BrandId,
                    BrandName = p.Brand?.Name ?? "Unknown Brand",
                    Code = p.Code,
                    DiscountType = p.DiscountType,
                    DiscountValue = p.DiscountValue,
                    MaxDiscountAmount = p.MaxDiscountAmount,
                    MinOrderAmount = p.MinOrderAmount,
                    UsageLimit = p.UsageLimit,
                    UsageCount = p.UsageCount,
                    IsActive = p.IsActive,
                    StartsAt = p.StartsAt,
                    ExpiresAt = p.ExpiresAt,
                    CreatedAt = p.CreatedAt,
                    Status = status
                };
            }).ToList();

            return Ok(result);
        }
    }
}
