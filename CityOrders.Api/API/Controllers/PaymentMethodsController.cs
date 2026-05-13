using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityOrders.Api.API.Controllers
{
    [Route("api")]
    [ApiController]
    public class PaymentMethodsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PaymentMethodsController(AppDbContext context)
        {
            _context = context;
        }

        // ==================== PUBLIC / MERCHANT ====================

        [HttpGet("payments/methods")]
        [AllowAnonymous] // Or [Authorize(Roles = "Merchant")] if preferred. Plan said "AllowAnonymous or Merchant".
        [Tags("Payments")]
        public async Task<ActionResult<IEnumerable<PaymentMethodDto>>> GetActivePaymentMethods()
        {
            var methods = await _context.PaymentMethods
                .AsNoTracking()
                .Where(pm => pm.IsActive)
                .OrderBy(pm => pm.SortOrder)
                .Select(pm => new PaymentMethodDto
                {
                    Id = pm.Id,
                    DisplayName = pm.DisplayName,
                    ReceiverName = pm.ReceiverName,
                    ReceiverNumber = pm.ReceiverNumber,
                    Instructions = pm.Instructions,
                    IsActive = pm.IsActive,
                    SortOrder = pm.SortOrder
                })
                .ToListAsync();

            return Ok(methods);
        }

        // ==================== ADMIN ====================

        [HttpGet("admin/payments/methods")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Payments")]
        public async Task<ActionResult<IEnumerable<PaymentMethodDto>>> GetAllPaymentMethods()
        {
            var methods = await _context.PaymentMethods
                .AsNoTracking()
                .OrderBy(pm => pm.SortOrder)
                .Select(pm => new PaymentMethodDto
                {
                    Id = pm.Id,
                    DisplayName = pm.DisplayName,
                    ReceiverName = pm.ReceiverName,
                    ReceiverNumber = pm.ReceiverNumber,
                    Instructions = pm.Instructions,
                    IsActive = pm.IsActive,
                    SortOrder = pm.SortOrder
                })
                .ToListAsync();

            return Ok(methods);
        }

        [HttpPost("admin/payments/methods")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Payments")]
        public async Task<ActionResult<PaymentMethodDto>> CreatePaymentMethod(CreatePaymentMethodDto dto)
        {
            var method = new PaymentMethod
            {
                DisplayName = dto.DisplayName,
                ReceiverName = dto.ReceiverName,
                ReceiverNumber = dto.ReceiverNumber,
                Instructions = dto.Instructions,
                IsActive = dto.IsActive,
                SortOrder = dto.SortOrder
            };

            _context.PaymentMethods.Add(method);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAllPaymentMethods), new { id = method.Id }, new PaymentMethodDto
            {
                Id = method.Id,
                DisplayName = method.DisplayName,
                ReceiverName = method.ReceiverName,
                ReceiverNumber = method.ReceiverNumber,
                Instructions = method.Instructions,
                IsActive = method.IsActive,
                SortOrder = method.SortOrder
            });
        }

        [HttpPut("admin/payments/methods/{id}")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Payments")]
        public async Task<IActionResult> UpdatePaymentMethod(int id, UpdatePaymentMethodDto dto)
        {
            var method = await _context.PaymentMethods.FindAsync(id);
            if (method == null) return NotFound("Payment method not found.");

            if (dto.DisplayName != null) method.DisplayName = dto.DisplayName;
            if (dto.ReceiverName != null) method.ReceiverName = dto.ReceiverName;
            if (dto.ReceiverNumber != null) method.ReceiverNumber = dto.ReceiverNumber;
            if (dto.Instructions != null) method.Instructions = dto.Instructions;
            if (dto.IsActive.HasValue) method.IsActive = dto.IsActive.Value;
            if (dto.SortOrder.HasValue) method.SortOrder = dto.SortOrder.Value;

            method.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new PaymentMethodDto
            {
                Id = method.Id,
                DisplayName = method.DisplayName,
                ReceiverName = method.ReceiverName,
                ReceiverNumber = method.ReceiverNumber,
                Instructions = method.Instructions,
                IsActive = method.IsActive,
                SortOrder = method.SortOrder
            });
        }

        [HttpPatch("admin/payments/methods/{id}/toggle")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Payments")]
        public async Task<IActionResult> TogglePaymentMethod(int id)
        {
            var method = await _context.PaymentMethods.FindAsync(id);
            if (method == null) return NotFound("Payment method not found.");

            method.IsActive = !method.IsActive;
            method.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { isActive = method.IsActive });
        }

        [HttpDelete("admin/payments/methods/{id}")]
        [Authorize(Roles = "Admin")]
        [Tags("Admin - Payments")]
        public async Task<IActionResult> DeletePaymentMethod(int id)
        {
            var method = await _context.PaymentMethods.FindAsync(id);
            if (method == null) return NotFound("Payment method not found.");

            _context.PaymentMethods.Remove(method);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Payment method deleted." });
        }
    }
}
