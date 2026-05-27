using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CityOrders.Api.Application.Services
{
    public class NotificationService
    {
        private readonly AppDbContext _context;

        public NotificationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task CreateAsync(int userId, string title, string message, string type, int? relatedOrderId = null)
        {
            _context.UserNotifications.Add(new UserNotification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                RelatedOrderId = relatedOrderId
            });

            await _context.SaveChangesAsync();
        }

        public async Task CreateForRoleAsync(string roleName, string title, string message, string type, int? relatedOrderId = null)
        {
            var userIds = await _context.UserRoles
                .Where(ur => ur.Role.Name == roleName && ur.User.IsActive)
                .Select(ur => ur.UserId)
                .Distinct()
                .ToListAsync();

            foreach (var userId in userIds)
            {
                _context.UserNotifications.Add(new UserNotification
                {
                    UserId = userId,
                    Title = title,
                    Message = message,
                    Type = type,
                    RelatedOrderId = relatedOrderId
                });
            }

            await _context.SaveChangesAsync();
        }
    }
}
