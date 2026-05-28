using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CityOrders.Api.API.Controllers
{
    [Route("api/admin/delivery/payment-requests")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    [Tags("Admin - Delivery Payment Requests")]
    public class AdminDeliveryPaymentRequestsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminDeliveryPaymentRequestsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DeliveryPaymentRequestListDto>>> GetRequests(
            [FromQuery] string? status = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = _context.DeliveryPaymentRequests
                .Include(r => r.AgentUser)
                .AsNoTracking();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(r => r.Status == status);
            }

            var requests = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new DeliveryPaymentRequestListDto
                {
                    Id = r.Id,
                    AgentUserId = r.AgentUserId,
                    AgentName = r.AgentUser.Name,
                    AgentEmail = r.AgentUser.Email,
                    Amount = r.Amount,
                    ProofFileUrl = r.ProofFilePath,
                    PayerNumber = r.PayerNumber,
                    Status = r.Status,
                    AdminNotes = r.AdminNotes,
                    CreatedAt = r.CreatedAt,
                    ReviewedAt = r.ReviewedAt
                })
                .ToListAsync();

            return Ok(requests);
        }

        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveRequest(int id)
        {
            var request = await _context.DeliveryPaymentRequests
                .Include(r => r.AgentUser)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null) return NotFound("Payment request not found.");
            if (request.Status != "Pending") return BadRequest("Only pending requests can be approved.");

            var adminUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (adminUserIdClaim == null) return Unauthorized();
            var adminUserId = int.Parse(adminUserIdClaim.Value);

            // Settle pilot's pending cash collections (DeliveryAssignment)
            var pendingAssignments = await _context.DeliveryAssignments
                .Where(a => a.AgentUserId == request.AgentUserId && a.CollectionStatus == DeliveryCollectionStatus.Pending)
                .OrderBy(a => a.CreatedAt)
                .ToListAsync();

            decimal remainingAmount = request.Amount;
            foreach (var assignment in pendingAssignments)
            {
                if (remainingAmount <= 0) break;

                var collectionAmount = assignment.CollectionAmount ?? 0m;
                if (collectionAmount <= 0) continue;

                if (collectionAmount <= remainingAmount)
                {
                    // Fully collect
                    assignment.CollectionStatus = DeliveryCollectionStatus.Collected;
                    assignment.CollectedAt = DateTime.UtcNow;
                    assignment.CollectedByUserId = adminUserId;
                    assignment.CollectionMethod = $"DeliveryPayment ({request.Amount} EGP)";
                    remainingAmount -= collectionAmount;
                }
                else
                {
                    // Partially collect
                    assignment.CollectionAmount -= remainingAmount;
                    remainingAmount = 0;
                }
            }

            // Update request status
            request.Status = "Approved";
            request.ReviewedByUserId = adminUserId;
            request.ReviewedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log Action
            _context.AuditLogs.Add(new AuditLog
            {
                Action = "DeliveryPaymentApproved",
                Target = $"DeliveryAgent: {request.AgentUserId} (Req: {id})",
                Summary = $"Approved payment request of {request.Amount} EGP. Cash collections settled.",
                AdminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "Unknown",
                AdminName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown"
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Payment request approved and cash collections settled successfully." });
        }

        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectRequest(int id, [FromBody] RejectDeliveryPaymentRequestDto dto)
        {
            var request = await _context.DeliveryPaymentRequests.FindAsync(id);
            if (request == null) return NotFound("Payment request not found.");
            if (request.Status != "Pending") return BadRequest("Only pending requests can be rejected.");

            var adminUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (adminUserIdClaim == null) return Unauthorized();
            var adminUserId = int.Parse(adminUserIdClaim.Value);

            request.Status = "Rejected";
            request.AdminNotes = dto.Reason;
            request.ReviewedByUserId = adminUserId;
            request.ReviewedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log Action
            _context.AuditLogs.Add(new AuditLog
            {
                Action = "DeliveryPaymentRejected",
                Target = $"DeliveryAgent: {request.AgentUserId} (Req: {id})",
                Summary = $"Rejected payment request. Reason: {dto.Reason}",
                AdminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "Unknown",
                AdminName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown"
            });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Payment request rejected successfully." });
        }
    }
}
