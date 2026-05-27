namespace CityOrders.Api.Domain.Entities
{
    public enum ChatThreadType
    {
        CustomerMerchant = 1,
        AdminMerchant = 2
    }

    public class ChatThread
    {
        public int Id { get; set; }
        public ChatThreadType Type { get; set; }
        public int? CustomerUserId { get; set; }
        public User? Customer { get; set; }
        public int MerchantUserId { get; set; }
        public User Merchant { get; set; } = null!;
        public int? AdminUserId { get; set; }
        public User? Admin { get; set; }
        public int? BrandId { get; set; }
        public Brand? Brand { get; set; }
        public int? OrderId { get; set; }
        public Order? Order { get; set; }
        public string Subject { get; set; } = string.Empty;
        public bool IsBlockedByCustomer { get; set; }
        public bool IsBlockedByMerchant { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }
}
