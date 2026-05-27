using System.ComponentModel.DataAnnotations;

namespace CityOrders.Api.Application.DTOs
{
    public class ChatThreadSummaryDto
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public int MerchantUserId { get; set; }
        public string MerchantName { get; set; } = string.Empty;
        public int? CustomerUserId { get; set; }
        public string? CustomerName { get; set; }
        public int? AdminUserId { get; set; }
        public string? AdminName { get; set; }
        public int? BrandId { get; set; }
        public string? BrandName { get; set; }
        public int? OrderId { get; set; }
        public string? OrderNumber { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string? LastMessage { get; set; }
        public DateTime? LastMessageAt { get; set; }
        public int UnreadCount { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsBlockedByCustomer { get; set; }
        public bool IsBlockedByMerchant { get; set; }
    }

    public class ChatMessageDto
    {
        public int Id { get; set; }
        public int ThreadId { get; set; }
        public int SenderUserId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? AttachmentUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsRead { get; set; }
        public bool IsMine { get; set; }
    }

    public class ChatThreadDetailDto
    {
        public ChatThreadSummaryDto Thread { get; set; } = new();
        public List<ChatMessageDto> Messages { get; set; } = new();
    }

    public class SendChatMessageDto
    {
        [MaxLength(1000)]
        public string? Body { get; set; }

        public string? AttachmentUrl { get; set; }
    }

    public class ChatMerchantOptionDto
    {
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? BrandName { get; set; }
    }
}
