using CityOrders.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CityOrders.Api.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            SeedMarketSectors(context);

            // Idempotency: Check if admins exist to skip heavyweight seeding
            // But we should check role existence first
            if (!context.Roles.Any())
            {
                // Roles should have been seeded by Migration/OnModelCreating.
                // If not, we have a bigger problem, or migration didn't run.
                // Assuming roles exist.
            }

            // 1. Admin
            var adminUser = context.Users.FirstOrDefault(u => u.Email == "desoky@gmail.com");
            if (adminUser == null)
            {
                var adminRole = context.Roles.FirstOrDefault(r => r.Name == "Admin");
                if (adminRole != null)
                {
                    adminUser = new User
                    {
                        Name = "Admin",
                        Email = "desoky@gmail.com",
                        PasswordHash = PasswordHasher.HashPassword("Desoky1!"),
                        IsActive = true
                    };
                    adminUser.UserRoles.Add(new UserRole { Role = adminRole });
                    context.Users.Add(adminUser);
                }
            }
            else
            {
                adminUser.PasswordHash = PasswordHasher.HashPassword("Desoky1!");
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
                        MarketSectorId = 1,
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

            NormalizeLegacyCategorySectors(context);

            // 5. Demo subscription data
            var demoPlan = context.SubscriptionPlans.FirstOrDefault(p => p.Name == "Demo Plan");
            if (demoPlan == null)
            {
                demoPlan = new SubscriptionPlan
                {
                    Name = "Demo Plan",
                    PriceEgp = 0,
                    DurationDays = 30,
                    GraceDays = 7,
                    IsEnabled = true,
                    MaxConcurrentOffers = 3
                };
                context.SubscriptionPlans.Add(demoPlan);
                context.SaveChanges();
            }

            var demoMerchant = context.Users
                .Include(u => u.MerchantProfile)
                    .ThenInclude(mp => mp!.Brand)
                .FirstOrDefault(u => u.Email == "merchant@cityorders.local");

            if (demoMerchant?.MerchantProfile != null)
            {
                demoMerchant.MerchantProfile.IsApproved = true;
                demoMerchant.MerchantProfile.IsActive = true;

                if (demoMerchant.MerchantProfile.Brand != null)
                {
                    demoMerchant.MerchantProfile.Brand.LocationLat ??= 30.0500m;
                    demoMerchant.MerchantProfile.Brand.LocationLng ??= 31.2400m;
                    demoMerchant.MerchantProfile.Brand.LocationUpdatedAt ??= DateTime.UtcNow;
                }

                var hasSubscription = context.MerchantSubscriptions.Any(s => s.UserId == demoMerchant.Id);
                if (!hasSubscription)
                {
                    var now = DateTime.UtcNow;
                    context.MerchantSubscriptions.Add(new MerchantSubscription
                    {
                        UserId = demoMerchant.Id,
                        PlanId = demoPlan.Id,
                        IsTrial = true,
                        StartDate = now,
                        EndDate = now.AddDays(demoPlan.DurationDays),
                        GraceEndDate = now.AddDays(demoPlan.DurationDays + demoPlan.GraceDays)
                    });
                }
            }

            context.SaveChanges();
        }

        private static void SeedMarketSectors(AppDbContext context)
        {
            var seeds = new[]
            {
                new MarketSector { Id = 1, Name = "Food & Restaurants", Slug = "food", Description = "Restaurants, groceries, drinks, and ready-to-order food.", IconKey = "food", SortOrder = 10, IsActive = true },
                new MarketSector { Id = 2, Name = "Fashion", Slug = "fashion", Description = "Clothing, shoes, accessories, and style stores.", IconKey = "tshirt", SortOrder = 20, IsActive = true },
                new MarketSector { Id = 3, Name = "Mobiles", Slug = "mobiles", Description = "Phones, accessories, repairs, and mobile services.", IconKey = "smartphone", SortOrder = 30, IsActive = true },
                new MarketSector { Id = 4, Name = "Computers", Slug = "computers", Description = "Laptops, PCs, parts, monitors, and peripherals.", IconKey = "laptop", SortOrder = 40, IsActive = true },
                new MarketSector { Id = 5, Name = "Home Appliances", Slug = "appliances", Description = "Appliances, electronics, and home devices.", IconKey = "appliance", SortOrder = 50, IsActive = true },
                new MarketSector { Id = 6, Name = "Pharmacy & Health", Slug = "pharmacy-health", Description = "Pharmacies, health products, and personal care.", IconKey = "medical", SortOrder = 60, IsActive = true },
            };

            foreach (var seed in seeds)
            {
                var existing = context.MarketSectors.FirstOrDefault(s => s.Id == seed.Id || s.Slug == seed.Slug);
                if (existing == null)
                {
                    context.MarketSectors.Add(seed);
                    continue;
                }

                existing.Name = seed.Name;
                existing.Slug = seed.Slug;
                existing.Description ??= seed.Description;
                existing.IconKey ??= seed.IconKey;
                existing.SortOrder = seed.SortOrder;
                existing.IsActive = true;
            }

            context.SaveChanges();
        }

        private static void NormalizeLegacyCategorySectors(AppDbContext context)
        {
            var foodSectorId = context.MarketSectors
                .Where(s => s.Slug == "food")
                .Select(s => s.Id)
                .FirstOrDefault();

            if (foodSectorId == 0) return;

            foreach (var category in context.Categories.Where(c => c.MarketSectorId == 0))
            {
                category.MarketSectorId = foodSectorId;
            }

            foreach (var brand in context.Brands.Where(b => b.MarketSectorId == 0))
            {
                brand.MarketSectorId = foodSectorId;
            }

            context.SaveChanges();
        }
    }
}
