using CityOrders.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CityOrders.Api.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            // Idempotency: Check if admins exist to skip heavyweight seeding
            // But we should check role existence first
            if (!context.Roles.Any())
            {
                // Roles should have been seeded by Migration/OnModelCreating.
                // If not, we have a bigger problem, or migration didn't run.
                // Assuming roles exist.
            }

            // 1. Admin
            if (!context.Users.Any(u => u.Email == "admin@cityorders.local"))
            {
                var adminRole = context.Roles.FirstOrDefault(r => r.Name == "Admin");
                if (adminRole != null)
                {
                    var adminUser = new User
                    {
                        Name = "Admin",
                        Email = "admin@cityorders.local",
                        PasswordHash = PasswordHasher.HashPassword("Admin@12345"),
                        IsActive = true
                    };
                    adminUser.UserRoles.Add(new UserRole { Role = adminRole });
                    context.Users.Add(adminUser);
                }
            }

            // 2. Merchant (with Brand)
            if (!context.Users.Any(u => u.Email == "merchant@cityorders.local"))
            {
                var merchantRole = context.Roles.FirstOrDefault(r => r.Name == "Merchant");
                if (merchantRole != null)
                {
                    var merchantUser = new User
                    {
                        Name = "Merchant User",
                        Email = "merchant@cityorders.local",
                        PasswordHash = PasswordHasher.HashPassword("Merchant@12345"),
                        IsActive = true,
                        MerchantProfile = new MerchantProfile { IsApproved = true, IsActive = true }
                    };
                    merchantUser.UserRoles.Add(new UserRole { Role = merchantRole });
                    
                    // Brand
                    var brand = new Brand
                    {
                        Name = "Demo Brand",
                        Address = "123 Market St",
                        Phone1 = "555-0101",
                        IsActive = true,
                        // MerchantUserId will be set by EF when adding user
                    };
                    merchantUser.MerchantProfile.Brand = brand; // Add via Navigation

                    // Products
                     var products = new List<Product>
                    {
                        new Product { Name = "Product 1", Price = 10.00m, Description = "Description 1", IsActive = true },
                        new Product { Name = "Product 2", Price = 20.50m, Description = "Description 2", IsActive = true },
                        new Product { Name = "Product 3", Price = 15.75m, Description = "Description 3", IsActive = true },
                        new Product { Name = "Product 4", Price = 5.00m, Description = "Description 4", IsActive = true },
                        new Product { Name = "Product 5", Price = 99.99m, Description = "Description 5", IsActive = true },
                        new Product { Name = "Product 6", Price = 12.00m, Description = "Description 6", IsActive = true },
                    };
                    
                    foreach(var p in products)
                    {
                        p.Photos.Add(new ProductPhoto { Url = $"https://via.placeholder.com/150?text={p.Name}", IsPrimary = true });
                        brand.Products.Add(p);
                    }

                    context.Users.Add(merchantUser);
                }
            }

            // 3. Customer
            if (!context.Users.Any(u => u.Email == "customer@cityorders.local"))
            {
                var customerRole = context.Roles.FirstOrDefault(r => r.Name == "Customer");
                if (customerRole != null)
                {
                    var customerUser = new User
                    {
                        Name = "Customer User",
                        Email = "customer@cityorders.local",
                        PasswordHash = PasswordHasher.HashPassword("Customer@12345"),
                        IsActive = true,
                        CustomerProfile = new CustomerProfile { IsActive = true }
                    };
                    customerUser.UserRoles.Add(new UserRole { Role = customerRole });
                    customerUser.CustomerProfile.Addresses.Add(new CustomerAddress { AddressLine = "789 Customer Ln", IsDefault = true });
                    // CustomerAddress in model: Id, CustomerUserId, AddressLine, Notes, IsDefault. No IsActive. 
                    // My previous edit might have missed checking Address properties. Let's fix property usage if wrong. 
                    // I will double check CustomerAddress entity definition before saving.
                    // The entity has: Id, CustomerUserId, AddressLine, Notes, IsDefault.
                    
                    context.Users.Add(customerUser);
                }
            }

            // 4. Delivery
            if (!context.Users.Any(u => u.Email == "delivery@cityorders.local"))
            {
                var deliveryRole = context.Roles.FirstOrDefault(r => r.Name == "Delivery");
                if (deliveryRole != null)
                {
                    var deliveryUser = new User
                    {
                        Name = "Delivery User",
                        Email = "delivery@cityorders.local",
                        PasswordHash = PasswordHasher.HashPassword("Delivery@12345"),
                        IsActive = true,
                        DeliveryProfile = new DeliveryProfile { IsActive = true }
                    };
                    deliveryUser.UserRoles.Add(new UserRole { Role = deliveryRole });
                    context.Users.Add(deliveryUser);
                }
            }

            context.SaveChanges();
        }
    }
}
