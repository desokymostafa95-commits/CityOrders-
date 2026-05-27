using CityOrders.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace CityOrders.Api.Infrastructure.Security
{
    public class AdminPermissionMiddleware
    {
        private readonly RequestDelegate _next;

        public AdminPermissionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, AppDbContext db)
        {
            var path = NormalizePath(context.Request.Path.Value);
            var method = context.Request.Method.ToUpperInvariant();

            if (!IsPermissionCheckedPath(path))
            {
                await _next(context);
                return;
            }

            if (IsAlwaysAllowed(path))
            {
                await _next(context);
                return;
            }

            if (context.User.Identity?.IsAuthenticated != true)
            {
                await _next(context);
                return;
            }

            var userIdText = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdText, out var userId))
            {
                await _next(context);
                return;
            }

            var roles = await db.UserRoles
                .Include(ur => ur.Role)
                .Where(ur => ur.UserId == userId)
                .Select(ur => ur.Role)
                .ToListAsync();

            if (roles.Any(r => r.Name == "Admin"))
            {
                await _next(context);
                return;
            }

            // If the user has no custom roles and is accessing chat, bypass permission checks.
            // Standard client/merchant authorization will be handled by the controller's policy and role attributes.
            if (path.StartsWith("/api/chat") && !roles.Any(r => r.IsCustom))
            {
                await _next(context);
                return;
            }

            var allowedPages = ResolveAllowedPages(path, method);
            if (allowedPages.Count == 0)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new { message = "You do not have permission to access this admin resource." });
                return;
            }

            var permissions = roles
                .Where(r => r.IsCustom)
                .SelectMany(r => ParsePermissions(r.Permissions))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            if (permissions.Contains("page:*") || allowedPages.Any(permissions.Contains))
            {
                await _next(context);
                return;
            }

            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new { message = "You do not have permission to access this admin resource." });
        }

        private static string NormalizePath(string? path)
        {
            if (string.IsNullOrWhiteSpace(path)) return string.Empty;
            return path.TrimEnd('/').ToLowerInvariant();
        }

        private static bool IsAlwaysAllowed(string path)
        {
            return path == "/api/adminusers/me/permissions"
                   || path == "/api/auth/change-password"
                   || path == "/api/auth/login"
                   || path == "/api/announcements/active";
        }

        private static bool IsPermissionCheckedPath(string path)
        {
            return path.StartsWith("/api/admin")
                   || path.StartsWith("/api/adminusers")
                   || path.StartsWith("/api/adminroles")
                   || path.StartsWith("/api/analytics/admin")
                   || path.StartsWith("/api/announcements")
                   || path.StartsWith("/api/chat");
        }

        private static List<string> ResolveAllowedPages(string path, string method)
        {
            if (path == "/api/admin/settings")
                return method == "GET"
                    ? new List<string> { "page:dashboard", "page:settings" }
                    : new List<string> { "page:settings" };

            if (path.StartsWith("/api/admin/delivery"))
                return new List<string> { "page:delivery-network" };

            if (path == "/api/admin/payments/methods" || path.StartsWith("/api/admin/payments/methods/"))
                return method == "GET"
                    ? new List<string> { "page:dashboard", "page:payment-methods" }
                    : new List<string> { "page:payment-methods" };

            if (path.StartsWith("/api/admin/dashboard-summary") || path.StartsWith("/api/analytics/admin/overview"))
                return new List<string> { "page:dashboard" };

            if (path.StartsWith("/api/admin/merchant-applications")
                || path.StartsWith("/api/admin/approve-merchant")
                || path.StartsWith("/api/admin/reject-merchant"))
                return new List<string> { "page:merchant-approvals" };

            if (path.StartsWith("/api/admin/merchants/"))
            {
                if (path.Contains("/subscription"))
                    return new List<string> { "page:subscriptions" };

                return new List<string> { "page:merchant-approvals" };
            }

            if (path.StartsWith("/api/admin/subscription-plans"))
                return new List<string> { "page:subscription-plans" };

            if (path.StartsWith("/api/admin/payment-requests"))
                return new List<string> { "page:subscription-payment-requests" };

            if (path.StartsWith("/api/admin/subscriptions-monitoring") || path.StartsWith("/api/admin/subscriptions/"))
                return new List<string> { "page:subscriptions" };

            if (path.StartsWith("/api/admin/audit"))
                return new List<string> { "page:audit-log" };

            if (path.StartsWith("/api/admin/categories"))
                return new List<string> { "page:categories" };

            if (path.StartsWith("/api/admin/promos"))
                return new List<string> { "page:promos" };

            if (path.StartsWith("/api/adminusers"))
                return new List<string> { "page:staff" };

            if (path.StartsWith("/api/adminroles"))
                return new List<string> { "page:roles-permissions" };

            if (path.StartsWith("/api/announcements"))
                return new List<string> { "page:announcements" };

            if (path.StartsWith("/api/chat"))
                return new List<string> { "page:chats" };

            return new List<string>();
        }

        private static List<string> ParsePermissions(string? permissionsJson)
        {
            if (string.IsNullOrWhiteSpace(permissionsJson)) return new List<string>();

            try
            {
                return JsonSerializer.Deserialize<List<string>>(permissionsJson) ?? new List<string>();
            }
            catch
            {
                return new List<string>();
            }
        }
    }
}
