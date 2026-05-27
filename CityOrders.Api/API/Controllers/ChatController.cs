using CityOrders.Api.Application.DTOs;
using CityOrders.Api.Application.Services;
using CityOrders.Api.Domain.Entities;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace CityOrders.Api.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly NotificationService _notificationService;
        private readonly IWebHostEnvironment _env;

        public ChatController(AppDbContext context, NotificationService notificationService, IWebHostEnvironment env)
        {
            _context = context;
            _notificationService = notificationService;
            _env = env;
        }

        private int GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (idClaim == null) throw new UnauthorizedAccessException();
            return int.Parse(idClaim.Value);
        }

        private bool IsInRole(string role) => User.IsInRole(role);

        [HttpGet("threads")]
        public async Task<ActionResult<IEnumerable<ChatThreadSummaryDto>>> GetThreads([FromQuery] string? type)
        {
            var userId = GetUserId();
            var query = BaseThreadQuery();

            if (Enum.TryParse<ChatThreadType>(type, true, out var threadType))
            {
                query = query.Where(t => t.Type == threadType);
            }

            if (IsInRole("Customer"))
            {
                query = query.Where(t => t.CustomerUserId == userId);
            }
            else if (IsInRole("Merchant"))
            {
                query = query.Where(t => t.MerchantUserId == userId);
            }
            else if (!IsInRole("Admin"))
            {
                return Forbid();
            }

            var threads = await query
                .OrderByDescending(t => t.UpdatedAt)
                .Take(60)
                .ToListAsync();

            return Ok(threads.Select(t => MapThread(t, userId)));
        }

        [HttpPost("customer/orders/{orderId}/thread")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<ChatThreadSummaryDto>> GetOrCreateCustomerOrderThread(int orderId)
        {
            var userId = GetUserId();
            var order = await _context.Orders
                .Include(o => o.Brand)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.CustomerUserId == userId);

            if (order == null) return NotFound();

            var thread = await _context.ChatThreads
                .FirstOrDefaultAsync(t => t.Type == ChatThreadType.CustomerMerchant && t.OrderId == order.Id);

            if (thread == null)
            {
                thread = new ChatThread
                {
                    Type = ChatThreadType.CustomerMerchant,
                    CustomerUserId = userId,
                    MerchantUserId = order.Brand.MerchantUserId,
                    BrandId = order.BrandId,
                    OrderId = order.Id,
                    Subject = $"طلب #{order.OrderNumber}",
                    UpdatedAt = DateTime.UtcNow
                };
                _context.ChatThreads.Add(thread);
                await _context.SaveChangesAsync();
            }

            thread = await BaseThreadQuery().FirstAsync(t => t.Id == thread.Id);
            return Ok(MapThread(thread, userId));
        }

        [HttpPost("merchant/orders/{orderId}/thread")]
        [Authorize(Roles = "Merchant")]
        public async Task<ActionResult<ChatThreadSummaryDto>> GetOrCreateMerchantOrderThread(int orderId)
        {
            var userId = GetUserId();
            var order = await _context.Orders
                .Include(o => o.Brand)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.Brand.MerchantUserId == userId);

            if (order == null) return NotFound();

            var thread = await _context.ChatThreads
                .FirstOrDefaultAsync(t => t.Type == ChatThreadType.CustomerMerchant && t.OrderId == order.Id);

            if (thread == null)
            {
                thread = new ChatThread
                {
                    Type = ChatThreadType.CustomerMerchant,
                    CustomerUserId = order.CustomerUserId,
                    MerchantUserId = userId,
                    BrandId = order.BrandId,
                    OrderId = order.Id,
                    Subject = $"طلب #{order.OrderNumber}",
                    UpdatedAt = DateTime.UtcNow
                };
                _context.ChatThreads.Add(thread);
                await _context.SaveChangesAsync();
            }

            thread = await BaseThreadQuery().FirstAsync(t => t.Id == thread.Id);
            return Ok(MapThread(thread, userId));
        }

        [HttpPost("admin/merchants/{merchantUserId}/thread")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ChatThreadSummaryDto>> GetOrCreateAdminMerchantThread(int merchantUserId)
        {
            var adminUserId = GetUserId();
            var merchant = await _context.Users
                .Include(u => u.MerchantProfile)
                    .ThenInclude(mp => mp!.Brand)
                .FirstOrDefaultAsync(u => u.Id == merchantUserId && u.MerchantProfile != null);

            if (merchant == null) return NotFound();

            var thread = await _context.ChatThreads
                .FirstOrDefaultAsync(t => t.Type == ChatThreadType.AdminMerchant &&
                                          t.MerchantUserId == merchantUserId &&
                                          t.AdminUserId == adminUserId);

            if (thread == null)
            {
                thread = new ChatThread
                {
                    Type = ChatThreadType.AdminMerchant,
                    MerchantUserId = merchantUserId,
                    AdminUserId = adminUserId,
                    BrandId = merchant.MerchantProfile?.Brand?.Id,
                    Subject = $"دعم {merchant.MerchantProfile?.Brand?.Name ?? merchant.Name}",
                    UpdatedAt = DateTime.UtcNow
                };
                _context.ChatThreads.Add(thread);
                await _context.SaveChangesAsync();
            }

            thread = await BaseThreadQuery().FirstAsync(t => t.Id == thread.Id);
            return Ok(MapThread(thread, adminUserId));
        }

        [HttpPost("merchant/admin/thread")]
        [Authorize(Roles = "Merchant")]
        public async Task<ActionResult<ChatThreadSummaryDto>> GetOrCreateMerchantAdminThread()
        {
            var merchantUserId = GetUserId();
            var brand = await _context.Brands.FirstOrDefaultAsync(b => b.MerchantUserId == merchantUserId);
            var admin = await _context.Users
                .Where(u => u.UserRoles.Any(ur => ur.Role.Name == "Admin") && u.IsActive)
                .OrderBy(u => u.Id)
                .FirstOrDefaultAsync();

            if (admin == null) return BadRequest("No admin account is available.");

            var thread = await _context.ChatThreads
                .FirstOrDefaultAsync(t => t.Type == ChatThreadType.AdminMerchant &&
                                          t.MerchantUserId == merchantUserId &&
                                          t.AdminUserId == admin.Id);

            if (thread == null)
            {
                thread = new ChatThread
                {
                    Type = ChatThreadType.AdminMerchant,
                    MerchantUserId = merchantUserId,
                    AdminUserId = admin.Id,
                    BrandId = brand?.Id,
                    Subject = $"دعم {brand?.Name ?? "التاجر"}",
                    UpdatedAt = DateTime.UtcNow
                };
                _context.ChatThreads.Add(thread);
                await _context.SaveChangesAsync();
            }

            thread = await BaseThreadQuery().FirstAsync(t => t.Id == thread.Id);
            return Ok(MapThread(thread, merchantUserId));
        }

        [HttpGet("threads/{threadId}")]
        public async Task<ActionResult<ChatThreadDetailDto>> GetThread(int threadId)
        {
            var userId = GetUserId();
            var thread = await BaseThreadQuery().FirstOrDefaultAsync(t => t.Id == threadId);
            if (thread == null) return NotFound();
            if (!CanAccess(thread, userId)) return Forbid();

            var unreadMessages = await _context.ChatMessages
                .Where(m => m.ThreadId == threadId && m.SenderUserId != userId && m.ReadAt == null)
                .ToListAsync();

            if (unreadMessages.Count > 0)
            {
                var now = DateTime.UtcNow;
                foreach (var message in unreadMessages)
                {
                    message.ReadAt = now;
                }
                await _context.SaveChangesAsync();
            }

            thread = await BaseThreadQuery().FirstAsync(t => t.Id == threadId);
            return Ok(new ChatThreadDetailDto
            {
                Thread = MapThread(thread, userId),
                Messages = thread.Messages
                    .OrderBy(m => m.CreatedAt)
                    .Select(m => MapMessage(m, userId))
                    .ToList()
            });
        }

        [HttpPost("threads/{threadId}/messages")]
        public async Task<ActionResult<ChatMessageDto>> SendMessage(int threadId, [FromBody] SendChatMessageDto dto)
        {
            var userId = GetUserId();
            var body = dto.Body?.Trim() ?? string.Empty;
            var attachmentUrl = dto.AttachmentUrl?.Trim();

            if (string.IsNullOrWhiteSpace(body) && string.IsNullOrWhiteSpace(attachmentUrl))
                return BadRequest("Message body or attachment is required.");

            var thread = await BaseThreadQuery().FirstOrDefaultAsync(t => t.Id == threadId);
            if (thread == null) return NotFound();
            if (!CanAccess(thread, userId)) return Forbid();
            if (thread.IsBlockedByCustomer || thread.IsBlockedByMerchant)
                return BadRequest("المحادثة محظورة ولا يمكن إرسال رسائل.");

            var message = new ChatMessage
            {
                ThreadId = threadId,
                SenderUserId = userId,
                Body = body,
                AttachmentUrl = attachmentUrl,
                CreatedAt = DateTime.UtcNow
            };

            thread.UpdatedAt = message.CreatedAt;
            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            var recipientId = ResolveRecipientId(thread, userId);
            if (recipientId.HasValue)
            {
                var notificationBody = string.IsNullOrWhiteSpace(body) ? "أرسل صورة" : (body.Length > 120 ? body[..120] : body);
                await _notificationService.CreateAsync(
                    recipientId.Value,
                    "رسالة جديدة",
                    notificationBody,
                    "ChatMessage",
                    thread.OrderId);
            }

            message = await _context.ChatMessages
                .Include(m => m.Sender)
                .FirstAsync(m => m.Id == message.Id);

            return Ok(MapMessage(message, userId));
        }

        [HttpPost("threads/{threadId}/block")]
        public async Task<IActionResult> BlockThread(int threadId)
        {
            var userId = GetUserId();
            var thread = await _context.ChatThreads.FirstOrDefaultAsync(t => t.Id == threadId);
            if (thread == null) return NotFound();
            if (!CanAccess(thread, userId)) return Forbid();

            if (thread.CustomerUserId == userId)
            {
                thread.IsBlockedByCustomer = true;
            }
            else if (thread.MerchantUserId == userId)
            {
                thread.IsBlockedByMerchant = true;
            }
            else
            {
                return BadRequest("Only customers or merchants involved in this thread can block it.");
            }

            thread.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("threads/{threadId}/unblock")]
        public async Task<IActionResult> UnblockThread(int threadId)
        {
            var userId = GetUserId();
            var thread = await _context.ChatThreads.FirstOrDefaultAsync(t => t.Id == threadId);
            if (thread == null) return NotFound();
            if (!CanAccess(thread, userId)) return Forbid();

            if (thread.CustomerUserId == userId)
            {
                thread.IsBlockedByCustomer = false;
            }
            else if (thread.MerchantUserId == userId)
            {
                thread.IsBlockedByMerchant = false;
            }
            else
            {
                return BadRequest("Only customers or merchants involved in this thread can unblock it.");
            }

            thread.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadAttachment(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("No file uploaded.");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
                return BadRequest("Invalid file type. Allowed: JPG, PNG, WEBP.");

            var uploadsDir = Path.Combine(_env.ContentRootPath, "uploads", "chats");
            if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);

            var fileName = $"chat_{Guid.NewGuid():N}{extension}";
            var filePath = Path.Combine(uploadsDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"/uploads/chats/{fileName}";
            return Ok(new { url });
        }

        [HttpGet("admin/merchants")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<ChatMerchantOptionDto>>> GetMerchantOptions([FromQuery] string? search)
        {
            var query = _context.Users
                .Include(u => u.MerchantProfile)
                    .ThenInclude(mp => mp!.Brand)
                .Where(u => u.MerchantProfile != null);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(u => u.Name.Contains(term) ||
                                         u.Email.Contains(term) ||
                                         (u.MerchantProfile!.Brand != null && u.MerchantProfile.Brand.Name.Contains(term)));
            }

            var items = await query
                .OrderBy(u => u.MerchantProfile!.Brand != null ? u.MerchantProfile.Brand.Name : u.Name)
                .Take(50)
                .Select(u => new ChatMerchantOptionDto
                {
                    UserId = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    BrandName = u.MerchantProfile!.Brand != null ? u.MerchantProfile.Brand.Name : null
                })
                .ToListAsync();

            return Ok(items);
        }

        private IQueryable<ChatThread> BaseThreadQuery() =>
            _context.ChatThreads
                .Include(t => t.Customer)
                .Include(t => t.Merchant)
                .Include(t => t.Admin)
                .Include(t => t.Brand)
                .Include(t => t.Order)
                .Include(t => t.Messages)
                    .ThenInclude(m => m.Sender);

        private bool CanAccess(ChatThread thread, int userId)
        {
            if (IsInRole("Admin")) return thread.Type == ChatThreadType.AdminMerchant;
            if (IsInRole("Merchant")) return thread.MerchantUserId == userId;
            if (IsInRole("Customer")) return thread.CustomerUserId == userId;
            return false;
        }

        private static int? ResolveRecipientId(ChatThread thread, int senderUserId)
        {
            if (thread.Type == ChatThreadType.CustomerMerchant)
            {
                return senderUserId == thread.CustomerUserId ? thread.MerchantUserId : thread.CustomerUserId;
            }

            return senderUserId == thread.MerchantUserId ? thread.AdminUserId : thread.MerchantUserId;
        }

        private static ChatThreadSummaryDto MapThread(ChatThread thread, int currentUserId)
        {
            var lastMessage = thread.Messages.OrderByDescending(m => m.CreatedAt).FirstOrDefault();
            return new ChatThreadSummaryDto
            {
                Id = thread.Id,
                Type = thread.Type.ToString(),
                MerchantUserId = thread.MerchantUserId,
                MerchantName = thread.Merchant.Name,
                CustomerUserId = thread.CustomerUserId,
                CustomerName = thread.Customer?.Name,
                AdminUserId = thread.AdminUserId,
                AdminName = thread.Admin?.Name,
                BrandId = thread.BrandId,
                BrandName = thread.Brand?.Name,
                OrderId = thread.OrderId,
                OrderNumber = thread.Order?.OrderNumber,
                Subject = thread.Subject,
                LastMessage = string.IsNullOrWhiteSpace(lastMessage?.Body) && !string.IsNullOrWhiteSpace(lastMessage?.AttachmentUrl) ? "[صورة]" : lastMessage?.Body,
                LastMessageAt = lastMessage?.CreatedAt,
                UpdatedAt = thread.UpdatedAt,
                UnreadCount = thread.Messages.Count(m => m.SenderUserId != currentUserId && m.ReadAt == null),
                IsBlockedByCustomer = thread.IsBlockedByCustomer,
                IsBlockedByMerchant = thread.IsBlockedByMerchant
            };
        }

        private static ChatMessageDto MapMessage(ChatMessage message, int currentUserId) => new()
        {
            Id = message.Id,
            ThreadId = message.ThreadId,
            SenderUserId = message.SenderUserId,
            SenderName = message.Sender.Name,
            Body = message.Body,
            AttachmentUrl = message.AttachmentUrl,
            CreatedAt = message.CreatedAt,
            IsRead = message.ReadAt.HasValue,
            IsMine = message.SenderUserId == currentUserId
        };
    }
}
