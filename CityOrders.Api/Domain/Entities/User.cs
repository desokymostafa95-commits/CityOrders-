using System;
using System.Collections.Generic;

namespace CityOrders.Api.Domain.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
        
        public CustomerProfile? CustomerProfile { get; set; }
        public MerchantProfile? MerchantProfile { get; set; }
        public DeliveryProfile? DeliveryProfile { get; set; }

        public ICollection<Brand> Brands { get; set; } = new List<Brand>();
        public ICollection<CustomerAddress> CustomerAddresses { get; set; } = new List<CustomerAddress>();
    }
}
