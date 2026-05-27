using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CityOrders.Api.Application.Services
{
    public class DeliveryDispatchResult
    {
        public bool Created { get; set; }
        public DeliveryAssignmentSource Source { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class DeliveryDispatchService
    {
        private readonly AppDbContext _context;

        public DeliveryDispatchService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<DeliveryDispatchResult> DispatchOrderAsync(int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.Brand)
                .Include(o => o.DeliveryAssignment)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
            {
                return new DeliveryDispatchResult { Message = "Order not found." };
            }

            if (order.DeliveryAssignment != null &&
                order.DeliveryAssignment.Status != DeliveryAssignmentStatus.Cancelled)
            {
                return new DeliveryDispatchResult
                {
                    Created = false,
                    Source = order.DeliveryAssignment.Source,
                    Message = "Delivery assignment already exists."
                };
            }

            var hasMerchantDelivery = await _context.DeliveryProfiles.AnyAsync(dp =>
                dp.AgentType == DeliveryAgentType.MerchantOwned &&
                dp.MerchantUserId == order.Brand.MerchantUserId &&
                dp.IsActive &&
                dp.IsAvailable);

            var source = hasMerchantDelivery
                ? DeliveryAssignmentSource.MerchantPrivate
                : DeliveryAssignmentSource.PlatformPool;

            var assignment = new DeliveryAssignment
            {
                OrderId = order.Id,
                Source = source,
                Status = DeliveryAssignmentStatus.Offered,
                DeliveryFeeSnapshot = order.DeliveryFee
            };

            _context.DeliveryAssignments.Add(assignment);
            await _context.SaveChangesAsync();

            return new DeliveryDispatchResult
            {
                Created = true,
                Source = source,
                Message = source == DeliveryAssignmentSource.MerchantPrivate
                    ? "Order offered to merchant private delivery agents."
                    : "No merchant delivery agent available. Order moved to CityOrders delivery pool."
            };
        }
    }
}
