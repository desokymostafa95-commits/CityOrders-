using CityOrders.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CityOrders.Api.API.Authorization
{
    /// <summary>
    /// Requires merchant to have an Active or Grace subscription.
    /// Returns 403 if subscription is Expired or None.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class RequireActiveSubscriptionAttribute : Attribute, IAsyncActionFilter
    {
        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var httpContext = context.HttpContext;
            var user = httpContext.User;

            if (!user.Identity?.IsAuthenticated ?? true)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var userId = int.Parse(userIdClaim.Value);
            var dbContext = httpContext.RequestServices.GetRequiredService<AppDbContext>();

            // Check if merchant is approved first
            var merchantProfile = await dbContext.MerchantProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(mp => mp.UserId == userId);

            if (merchantProfile == null || !merchantProfile.IsApproved)
            {
                context.Result = new ObjectResult(new { error = "Your merchant account is pending admin approval. Access to this feature is restricted until approved." })
                {
                    StatusCode = 403
                };
                return;
            }

            if (!merchantProfile.IsActive)
            {
                context.Result = new ObjectResult(new { error = "Your merchant account has been deactivated by an administrator. Access is restricted." })
                {
                    StatusCode = 403
                };
                return;
            }

            var subscription = await dbContext.MerchantSubscriptions
                .AsNoTracking()
                .FirstOrDefaultAsync(ms => ms.UserId == userId);

            if (subscription == null)
            {
                context.Result = new ObjectResult(new { error = "No active subscription. Please subscribe to access this feature." })
                {
                    StatusCode = 403
                };
                return;
            }

            var state = subscription.GetState();
            if (state == "Expired")
            {
                context.Result = new ObjectResult(new { error = "Your subscription has expired. Please renew to access this feature." })
                {
                    StatusCode = 403
                };
                return;
            }

            // Active or Grace - allow through
            await next();
        }
    }
}
