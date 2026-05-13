using CityOrders.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CityOrders.Api.Infrastructure.Jobs
{
    /// <summary>
    /// Background job that runs periodically to expire merchant subscriptions
    /// and set IsActive = false when grace period ends.
    /// </summary>
    public class ExpireSubscriptionsJob : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<ExpireSubscriptionsJob> _logger;
        private readonly TimeSpan _interval = TimeSpan.FromHours(1);

        public ExpireSubscriptionsJob(IServiceScopeFactory scopeFactory, ILogger<ExpireSubscriptionsJob> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ExpireSubscriptionsJob started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessExpiredSubscriptions();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing expired subscriptions.");
                }

                await Task.Delay(_interval, stoppingToken);
            }

            _logger.LogInformation("ExpireSubscriptionsJob stopped.");
        }

        private async Task ProcessExpiredSubscriptions()
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var now = DateTime.UtcNow;

            // Find merchants with expired subscriptions who are still active
            var expiredMerchants = await context.MerchantSubscriptions
                .Include(ms => ms.User)
                    .ThenInclude(u => u.MerchantProfile)
                .Where(ms => ms.GraceEndDate < now && ms.User.MerchantProfile != null && ms.User.MerchantProfile.IsActive)
                .ToListAsync();

            if (expiredMerchants.Count == 0)
            {
                _logger.LogDebug("No expired subscriptions to process.");
                return;
            }

            foreach (var subscription in expiredMerchants)
            {
                if (subscription.User.MerchantProfile != null)
                {
                    subscription.User.MerchantProfile.IsActive = false;
                    subscription.User.MerchantProfile.UpdatedAt = now;
                    _logger.LogInformation("Deactivated merchant {UserId} due to expired subscription.", subscription.UserId);

                    // Force close open shifts for this merchant
                    var openShifts = await context.MerchantShifts
                        .Where(s => s.Brand.MerchantUserId == subscription.UserId && s.Status == Domain.Entities.ShiftStatus.Open)
                        .ToListAsync();

                    foreach (var shift in openShifts)
                    {
                        shift.Status = Domain.Entities.ShiftStatus.Closed;
                        shift.EndAt = now;
                        shift.ClosedAt = now;
                    }
                }
            }

            await context.SaveChangesAsync();
            _logger.LogInformation("Processed {Count} expired subscriptions.", expiredMerchants.Count);
        }
    }
}
