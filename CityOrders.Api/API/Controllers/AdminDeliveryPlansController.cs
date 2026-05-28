using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CityOrders.Api.API.Controllers
{
    [Route("api/admin/delivery/plans")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    [Tags("Admin - Delivery Plans")]
    public class AdminDeliveryPlansController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminDeliveryPlansController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DeliveryPlanDto>>> GetPlans()
        {
            var plans = await _context.DeliveryPlans
                .AsNoTracking()
                .OrderBy(dp => dp.Id)
                .Select(dp => new DeliveryPlanDto
                {
                    Id = dp.Id,
                    Name = dp.Name,
                    PriceEgp = dp.PriceEgp,
                    DurationDays = dp.DurationDays,
                    IsEnabled = dp.IsEnabled,
                    Description = dp.Description,
                    CreatedAt = dp.CreatedAt
                })
                .ToListAsync();

            return Ok(plans);
        }

        [HttpPost]
        public async Task<IActionResult> CreatePlan([FromBody] CreateDeliveryPlanDto dto)
        {
            if (await _context.DeliveryPlans.AnyAsync(dp => dp.Name == dto.Name))
                return BadRequest("A plan with this name already exists.");

            var plan = new DeliveryPlan
            {
                Name = dto.Name,
                PriceEgp = dto.PriceEgp,
                DurationDays = dto.DurationDays,
                Description = dto.Description,
                IsEnabled = true
            };

            _context.DeliveryPlans.Add(plan);
            await _context.SaveChangesAsync();

            // Log Action
            _context.AuditLogs.Add(new AuditLog
            {
                Action = "DeliveryPlanCreated",
                Target = $"DeliveryPlan: {plan.Id} ({plan.Name})",
                Summary = $"Delivery plan created. Price: {plan.PriceEgp} EGP, Duration: {plan.DurationDays} days.",
                AdminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "Unknown",
                AdminName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown"
            });
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPlans), new { id = plan.Id }, new { id = plan.Id, message = "Delivery plan created successfully." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePlan(int id, [FromBody] UpdateDeliveryPlanDto dto)
        {
            var plan = await _context.DeliveryPlans.FindAsync(id);
            if (plan == null) return NotFound("Plan not found.");

            if (dto.Name != null)
            {
                if (await _context.DeliveryPlans.AnyAsync(dp => dp.Name == dto.Name && dp.Id != id))
                    return BadRequest("A plan with this name already exists.");
                plan.Name = dto.Name;
            }

            if (dto.PriceEgp.HasValue) plan.PriceEgp = dto.PriceEgp.Value;
            if (dto.DurationDays.HasValue) plan.DurationDays = dto.DurationDays.Value;
            if (dto.Description != null) plan.Description = dto.Description;

            plan.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Log Action
            _context.AuditLogs.Add(new AuditLog
            {
                Action = "DeliveryPlanUpdated",
                Target = $"DeliveryPlan: {id} ({plan.Name})",
                Summary = "Delivery plan updated.",
                AdminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "Unknown",
                AdminName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown"
            });
            await _context.SaveChangesAsync();

            return Ok(new DeliveryPlanDto
            {
                Id = plan.Id,
                Name = plan.Name,
                PriceEgp = plan.PriceEgp,
                DurationDays = plan.DurationDays,
                IsEnabled = plan.IsEnabled,
                Description = plan.Description,
                CreatedAt = plan.CreatedAt
            });
        }

        [HttpPost("{id}/toggle")]
        public async Task<IActionResult> TogglePlan(int id)
        {
            var plan = await _context.DeliveryPlans.FindAsync(id);
            if (plan == null) return NotFound("Plan not found.");

            plan.IsEnabled = !plan.IsEnabled;
            plan.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Log Action
            _context.AuditLogs.Add(new AuditLog
            {
                Action = "DeliveryPlanToggled",
                Target = $"DeliveryPlan: {id} ({plan.Name})",
                Summary = $"Delivery plan {(plan.IsEnabled ? "enabled" : "disabled")}.",
                AdminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "Unknown",
                AdminName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown"
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Plan {(plan.IsEnabled ? "enabled" : "disabled")} successfully.", isEnabled = plan.IsEnabled });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePlan(int id)
        {
            var plan = await _context.DeliveryPlans.FindAsync(id);
            if (plan == null) return NotFound("Plan not found.");

            // Remove associated payment requests
            var relatedPaymentRequests = _context.DeliveryPaymentRequests.Where(dpr => dpr.PlanId == id);
            _context.DeliveryPaymentRequests.RemoveRange(relatedPaymentRequests);

            _context.DeliveryPlans.Remove(plan);
            await _context.SaveChangesAsync();

            // Log Action
            _context.AuditLogs.Add(new AuditLog
            {
                Action = "DeliveryPlanDeleted",
                Target = $"DeliveryPlan: {id} ({plan.Name})",
                Summary = "Delivery plan deleted by Admin. Associated payment requests were also removed.",
                AdminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "Unknown",
                AdminName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown"
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Plan deleted successfully." });
        }
    }
}
