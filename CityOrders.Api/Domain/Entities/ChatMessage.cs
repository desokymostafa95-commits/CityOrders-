namespace CityOrders.Api.Domain.Entities
{
    public class ChatMessage
    {
        public int Id { get; set; }
        public int ThreadId { get; set; }
        public ChatThread Thread { get; set; } = null!;
        public int SenderUserId { get; set; }
        public User Sender { get; set; } = null!;
        public string Body { get; set; } = string.Empty;
        public string? AttachmentUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReadAt { get; set; }
    }
}
