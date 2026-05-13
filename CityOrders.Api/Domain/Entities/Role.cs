using System.Collections.Generic;

namespace CityOrders.Api.Domain.Entities
{
    public class Role
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        
        /// <summary>JSON array of endpoints this role is allowed to access (e.g. ["GET:/api/admin/promos"])</summary>
        public string Permissions { get; set; } = "[]";

        /// <summary>True for user-created custom roles. False for system roles (Admin, Merchant, etc.)</summary>
        public bool IsCustom { get; set; } = false;

        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }
}
