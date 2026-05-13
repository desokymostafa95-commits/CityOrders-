using CityOrders.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CityOrders.Api.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<CustomerProfile> CustomerProfiles { get; set; }
        public DbSet<MerchantProfile> MerchantProfiles { get; set; }
        public DbSet<DeliveryProfile> DeliveryProfiles { get; set; }
        public DbSet<CustomerAddress> CustomerAddresses { get; set; }
        public DbSet<Brand> Brands { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductPhoto> ProductPhotos { get; set; }
        public DbSet<BrandCategory> BrandCategories { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }
        public DbSet<MerchantSubscription> MerchantSubscriptions { get; set; }
        public DbSet<SubscriptionPaymentRequest> SubscriptionPaymentRequests { get; set; }
        public DbSet<MerchantShift> MerchantShifts { get; set; }
        public DbSet<MerchantShiftOrder> MerchantShiftOrders { get; set; }
        public DbSet<MerchantShiftLine> MerchantShiftLines { get; set; }
        public DbSet<AppSettings> AppSettings { get; set; }
        public DbSet<PaymentMethod> PaymentMethods { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<BrandOffer> BrandOffers { get; set; } = null!;
        public DbSet<PromoCode> PromoCodes { get; set; } = null!;
        public DbSet<PromoCodeUsage> PromoCodeUsages { get; set; } = null!;
        public DbSet<GlobalAnnouncement> Announcements { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
            modelBuilder.Entity<User>()
                .Property(u => u.CreatedAt)
                .HasDefaultValueSql("SYSUTCDATETIME()");
            modelBuilder.Entity<User>()
                .Property(u => u.IsActive)
                .HasDefaultValue(true);

            // Role
            modelBuilder.Entity<Role>()
                .HasIndex(r => r.Name)
                .IsUnique();

            // Seed Roles
            modelBuilder.Entity<Role>().HasData(
                new Role { Id = 1, Name = "Customer" },
                new Role { Id = 2, Name = "Merchant" },
                new Role { Id = 3, Name = "Delivery" },
                new Role { Id = 4, Name = "Admin" }
            );

            // UserRole (Composite PK)
            modelBuilder.Entity<UserRole>()
                .HasKey(ur => new { ur.UserId, ur.RoleId });

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId);

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId);

            // CustomerProfile (1:1 with User, PK=FK)
            modelBuilder.Entity<CustomerProfile>()
                .HasKey(cp => cp.UserId);
            modelBuilder.Entity<CustomerProfile>()
                .HasOne(cp => cp.User)
                .WithOne(u => u.CustomerProfile)
                .HasForeignKey<CustomerProfile>(cp => cp.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<CustomerProfile>()
                .Property(cp => cp.IsActive)
                .HasDefaultValue(true);

            // MerchantProfile (1:1 with User, PK=FK)
            modelBuilder.Entity<MerchantProfile>()
                .HasKey(mp => mp.UserId);
            modelBuilder.Entity<MerchantProfile>()
                .HasOne(mp => mp.User)
                .WithOne(u => u.MerchantProfile)
                .HasForeignKey<MerchantProfile>(mp => mp.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<MerchantProfile>()
                .Property(mp => mp.IsApproved)
                .HasDefaultValue(false);
            modelBuilder.Entity<MerchantProfile>()
                .Property(mp => mp.IsActive)
                .HasDefaultValue(true);
            modelBuilder.Entity<MerchantProfile>()
                .Property(mp => mp.CreatedAt)
                .HasDefaultValueSql("SYSUTCDATETIME()");

            // DeliveryProfile (1:1 with User, PK=FK)
            modelBuilder.Entity<DeliveryProfile>()
                .HasKey(dp => dp.UserId);
            modelBuilder.Entity<DeliveryProfile>()
                .HasOne(dp => dp.User)
                .WithOne(u => u.DeliveryProfile)
                .HasForeignKey<DeliveryProfile>(dp => dp.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<DeliveryProfile>()
                .Property(dp => dp.IsActive)
                .HasDefaultValue(true);

            // Brand
            modelBuilder.Entity<Brand>()
                .HasIndex(b => b.MerchantUserId)
                .IsUnique(); // 1:1 with Merchant User
            
            // NOTE: The navigation property in Brand is mapped to MerchantProfile, but the FK is MerchantUserId.
            // Since MerchantProfile also has PK=UserId, we can map it via that key.
            // Or simpler, map to User. Let's map to User for simplicity to match the UserId FK.
            // But wait, the Entity definition I wrote for Brand has `MerchantProfile MerchantProfile`.
            // So I should map it to MerchantProfile.
            modelBuilder.Entity<Brand>()
                .HasOne(b => b.MerchantProfile)
                .WithOne(mp => mp.Brand)
                .HasForeignKey<Brand>(b => b.MerchantUserId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent deleting merchant if brand exists or vice versa? 
                // Spec says "One-to-one profiles (PK=FK) with cascade delete".
                // But Brand has its own PK Id. Brand 1:1 Merchant.
                
            modelBuilder.Entity<Brand>()
                .Property(b => b.IsActive)
                .HasDefaultValue(true);
            
            modelBuilder.Entity<Brand>()
                .Property(b => b.LocationLat)
                .HasPrecision(9, 6);
                
            modelBuilder.Entity<Brand>()
                .Property(b => b.LocationLng)
                .HasPrecision(9, 6);
            modelBuilder.Entity<Brand>()
                .Property(b => b.CreatedAt)
                .HasDefaultValueSql("SYSUTCDATETIME()");
            modelBuilder.Entity<Brand>()
                .Property(b => b.FixedDeliveryFee)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Brand>()
                .Property(b => b.MinVariableDeliveryFee)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Brand>()
                .Property(b => b.MaxVariableDeliveryFee)
                .HasPrecision(18, 2);
            // Distance-based pricing
            modelBuilder.Entity<Brand>()
                .Property(b => b.BaseDeliveryFee)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Brand>()
                .Property(b => b.FeePerMeter)
                .HasPrecision(18, 6);
            modelBuilder.Entity<Brand>()
                .Property(b => b.MinDeliveryFee)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Brand>()
                .Property(b => b.MaxDeliveryFee)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Product>()
                .HasIndex(p => p.BrandId);

            modelBuilder.Entity<Product>()
                .HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Product>()
                .Property(p => p.Price)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Product>()
                .Property(p => p.QuantityStep)
                .HasPrecision(18, 2);

            // BrandCategory
            modelBuilder.Entity<BrandCategory>()
                .HasIndex(bc => new { bc.BrandId, bc.Name })
                .IsUnique();
            modelBuilder.Entity<BrandCategory>()
                .HasIndex(bc => new { bc.BrandId, bc.SortOrder });
            modelBuilder.Entity<BrandCategory>()
                .Property(bc => bc.IsActive)
                .HasDefaultValue(true);
            modelBuilder.Entity<BrandCategory>()
                .Property(bc => bc.CreatedAt)
                .HasDefaultValueSql("SYSUTCDATETIME()");
            modelBuilder.Entity<BrandCategory>()
                .HasOne(bc => bc.Brand)
                .WithMany(b => b.Categories)
                .HasForeignKey(bc => bc.BrandId)
                .OnDelete(DeleteBehavior.Cascade);

            // ProductPhoto
            modelBuilder.Entity<ProductPhoto>()
                .Property(p => p.IsPrimary)
                .HasDefaultValue(false);

            // CustomerAddress
            modelBuilder.Entity<CustomerAddress>()
                .HasOne(ca => ca.CustomerProfile)
                .WithMany(cp => cp.Addresses)
                .HasForeignKey(ca => ca.CustomerUserId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<CustomerAddress>()
                .Property(ca => ca.IsDefault)
                .HasDefaultValue(false);
            modelBuilder.Entity<CustomerAddress>()
                .Property(ca => ca.Lat)
                .HasPrecision(9, 6);
            modelBuilder.Entity<CustomerAddress>()
                .Property(ca => ca.Lng)
                .HasPrecision(9, 6);

            // Order
            modelBuilder.Entity<Order>()
                .HasIndex(o => o.OrderNumber)
                .IsUnique();
            modelBuilder.Entity<Order>()
                .HasIndex(o => o.CustomerUserId);
            modelBuilder.Entity<Order>()
                .HasIndex(o => o.BrandId);
            
            modelBuilder.Entity<Order>()
                .Property(o => o.Subtotal)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Order>()
                .Property(o => o.DeliveryFee)
                .HasPrecision(18, 2)
                .HasDefaultValue(0);
            modelBuilder.Entity<Order>()
                .Property(o => o.Total)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Order>()
                .Property(o => o.CreatedAt)
                .HasDefaultValueSql("SYSUTCDATETIME()");
            // Delivery pricing snapshot
            modelBuilder.Entity<Order>()
                .Property(o => o.BaseDeliveryFeeSnapshot)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Order>()
                .Property(o => o.FeePerMeterSnapshot)
                .HasPrecision(18, 6);
            modelBuilder.Entity<Order>()
                .Property(o => o.MinDeliveryFeeSnapshot)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Order>()
                .Property(o => o.MaxDeliveryFeeSnapshot)
                .HasPrecision(18, 2);

             modelBuilder.Entity<Order>()
                .HasOne(o => o.Customer)
                .WithMany()
                .HasForeignKey(o => o.CustomerUserId)
                .OnDelete(DeleteBehavior.Restrict);

             modelBuilder.Entity<Order>()
                .HasOne(o => o.Brand)
                .WithMany()
                .HasForeignKey(o => o.BrandId)
                .OnDelete(DeleteBehavior.Restrict);

             modelBuilder.Entity<Order>()
                .HasOne(o => o.DeliveryUser)
                .WithMany()
                .HasForeignKey(o => o.DeliveryUserId)
                .OnDelete(DeleteBehavior.Restrict);
            
             modelBuilder.Entity<Order>()
                .HasOne(o => o.DeliveryAddress)
                .WithMany()
                .HasForeignKey(o => o.DeliveryAddressId)
                .OnDelete(DeleteBehavior.Restrict);

            // OrderItem
            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.UnitPriceSnapshot)
                .HasPrecision(18, 2);
            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.LineTotal)
                .HasPrecision(18, 2);

            // SubscriptionPlan
            modelBuilder.Entity<SubscriptionPlan>()
                .HasIndex(sp => sp.Name)
                .IsUnique();
            modelBuilder.Entity<SubscriptionPlan>()
                .Property(sp => sp.PriceEgp)
                .HasPrecision(10, 2);
            modelBuilder.Entity<SubscriptionPlan>()
                .Property(sp => sp.IsEnabled)
                .HasDefaultValue(true);
            modelBuilder.Entity<SubscriptionPlan>()
                .Property(sp => sp.GraceDays)
                .HasDefaultValue(7);
            modelBuilder.Entity<SubscriptionPlan>()
                .Property(sp => sp.CreatedAt)
                .HasDefaultValueSql("SYSUTCDATETIME()");

            // MerchantSubscription (One per merchant)
            modelBuilder.Entity<MerchantSubscription>()
                .HasIndex(ms => ms.UserId)
                .IsUnique();
            modelBuilder.Entity<MerchantSubscription>()
                .HasIndex(ms => ms.GraceEndDate);
            modelBuilder.Entity<MerchantSubscription>()
                .HasOne(ms => ms.User)
                .WithOne()
                .HasForeignKey<MerchantSubscription>(ms => ms.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<MerchantSubscription>()
                .HasOne(ms => ms.Plan)
                .WithMany(sp => sp.MerchantSubscriptions)
                .HasForeignKey(ms => ms.PlanId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<MerchantSubscription>()
                .Property(ms => ms.CreatedAt)
                .HasDefaultValueSql("SYSUTCDATETIME()");

            // SubscriptionPaymentRequest
            modelBuilder.Entity<SubscriptionPaymentRequest>()
                .HasIndex(spr => new { spr.UserId, spr.Status });
            modelBuilder.Entity<SubscriptionPaymentRequest>()
                .HasIndex(spr => spr.Status);
            modelBuilder.Entity<SubscriptionPaymentRequest>()
                .Property(spr => spr.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Pending");
            modelBuilder.Entity<SubscriptionPaymentRequest>()
                .Property(spr => spr.ProofFilePath)
                .HasMaxLength(500);
            modelBuilder.Entity<SubscriptionPaymentRequest>()
                .Property(spr => spr.AdminNotes)
                .HasMaxLength(1000);
            modelBuilder.Entity<SubscriptionPaymentRequest>()
                .HasOne(spr => spr.User)
                .WithMany()
                .HasForeignKey(spr => spr.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<SubscriptionPaymentRequest>()
                .HasOne(spr => spr.Plan)
                .WithMany(sp => sp.PaymentRequests)
                .HasForeignKey(spr => spr.PlanId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<SubscriptionPaymentRequest>()
                .HasOne(spr => spr.ReviewedByUser)
                .WithMany()
                .HasForeignKey(spr => spr.ReviewedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
            modelBuilder.Entity<SubscriptionPaymentRequest>()
                .Property(spr => spr.CreatedAt)
                .HasDefaultValueSql("SYSUTCDATETIME()");

            // MerchantShift
            modelBuilder.Entity<MerchantShift>()
                .HasIndex(ms => ms.BrandId);
            modelBuilder.Entity<MerchantShift>()
                .HasIndex(ms => ms.Status);
            modelBuilder.Entity<MerchantShift>()
                .HasIndex(ms => ms.InvoiceNumber)
                .IsUnique();
            modelBuilder.Entity<MerchantShift>()
                .Property(ms => ms.GrossSales)
                .HasPrecision(18, 2);
            modelBuilder.Entity<MerchantShift>()
                .Property(ms => ms.Currency)
                .HasMaxLength(5);
            modelBuilder.Entity<MerchantShift>()
                .HasOne(ms => ms.Brand)
                .WithMany()
                .HasForeignKey(ms => ms.BrandId)
                .OnDelete(DeleteBehavior.Restrict);

            // MerchantShiftOrder
            modelBuilder.Entity<MerchantShiftOrder>()
                .HasOne(mso => mso.MerchantShift)
                .WithMany(ms => ms.Orders)
                .HasForeignKey(mso => mso.MerchantShiftId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<MerchantShiftOrder>()
                .HasOne(mso => mso.Order)
                .WithMany()
                .HasForeignKey(mso => mso.OrderId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<MerchantShiftOrder>()
                .Property(mso => mso.TotalSnapshot)
                .HasPrecision(18, 2);

            // MerchantShiftLine
            modelBuilder.Entity<MerchantShiftLine>()
                .HasOne(msl => msl.MerchantShift)
                .WithMany(ms => ms.Lines)
                .HasForeignKey(msl => msl.MerchantShiftId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<MerchantShiftLine>()
                .Property(msl => msl.UnitPriceSnapshot)
                .HasPrecision(18, 2);
            modelBuilder.Entity<MerchantShiftLine>()
                .Property(msl => msl.LineTotal)
                .HasPrecision(18, 2);

            // PaymentMethod
            modelBuilder.Entity<PaymentMethod>()
                .HasIndex(pm => new { pm.IsActive, pm.SortOrder });
            modelBuilder.Entity<PaymentMethod>()
                .Property(pm => pm.CreatedAt)
                .HasDefaultValueSql("SYSUTCDATETIME()");

            // AuditLog
            modelBuilder.Entity<AuditLog>()
                .HasIndex(al => al.Timestamp);
            modelBuilder.Entity<AuditLog>()
                .HasIndex(al => al.Action);
            modelBuilder.Entity<AuditLog>()
                .Property(al => al.Timestamp)
                .HasDefaultValueSql("SYSUTCDATETIME()");

            // Category
            modelBuilder.Entity<Category>()
                .HasIndex(c => c.Slug)
                .IsUnique();
            modelBuilder.Entity<Category>()
                .Property(c => c.CreatedAt)
                .HasDefaultValueSql("SYSUTCDATETIME()");

            modelBuilder.Entity<Brand>()
                .HasMany(b => b.MasterCategories)
                .WithMany(c => c.Brands)
                .UsingEntity(j => j.ToTable("BrandMasterCategories"));

            // BrandOffer
            modelBuilder.Entity<BrandOffer>()
                .Property(bo => bo.OfferPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<BrandOffer>()
                .HasIndex(bo => bo.BrandId);

            modelBuilder.Entity<BrandOffer>()
                .HasIndex(bo => new { bo.IsActive, bo.StartAt, bo.EndAt });

            modelBuilder.Entity<BrandOffer>()
                .HasOne(bo => bo.Brand)
                .WithMany()
                .HasForeignKey(bo => bo.BrandId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<BrandOffer>()
                .HasOne(bo => bo.Product)
                .WithMany()
                .HasForeignKey(bo => bo.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            // PromoCode
            modelBuilder.Entity<PromoCode>()
                .HasIndex(pc => new { pc.BrandId, pc.Code })
                .IsUnique();
            modelBuilder.Entity<PromoCode>()
                .Property(pc => pc.Code)
                .HasMaxLength(50);
            modelBuilder.Entity<PromoCode>()
                .Property(pc => pc.DiscountType)
                .HasMaxLength(20);
            modelBuilder.Entity<PromoCode>()
                .Property(pc => pc.DiscountValue)
                .HasPrecision(18, 2);
            modelBuilder.Entity<PromoCode>()
                .Property(pc => pc.MaxDiscountAmount)
                .HasPrecision(18, 2);
            modelBuilder.Entity<PromoCode>()
                .Property(pc => pc.MinOrderAmount)
                .HasPrecision(18, 2);
            modelBuilder.Entity<PromoCode>()
                .Property(pc => pc.IsActive)
                .HasDefaultValue(true);
            modelBuilder.Entity<PromoCode>()
                .Property(pc => pc.CreatedAt)
                .HasDefaultValueSql("SYSUTCDATETIME()");
            modelBuilder.Entity<PromoCode>()
                .HasOne(pc => pc.Brand)
                .WithMany()
                .HasForeignKey(pc => pc.BrandId)
                .OnDelete(DeleteBehavior.Cascade);

            // PromoCodeUsage
            modelBuilder.Entity<PromoCodeUsage>()
                .HasIndex(u => new { u.PromoCodeId, u.CustomerUserId })
                .IsUnique(); // One use per customer per code
            modelBuilder.Entity<PromoCodeUsage>()
                .Property(u => u.DiscountApplied)
                .HasPrecision(18, 2);
            modelBuilder.Entity<PromoCodeUsage>()
                .Property(u => u.UsedAt)
                .HasDefaultValueSql("SYSUTCDATETIME()");
            modelBuilder.Entity<PromoCodeUsage>()
                .HasOne(u => u.PromoCode)
                .WithMany(pc => pc.Usages)
                .HasForeignKey(u => u.PromoCodeId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<PromoCodeUsage>()
                .HasOne(u => u.Customer)
                .WithMany()
                .HasForeignKey(u => u.CustomerUserId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<PromoCodeUsage>()
                .HasOne(u => u.Order)
                .WithMany()
                .HasForeignKey(u => u.OrderId)
                .OnDelete(DeleteBehavior.Restrict);

            // Order — promo code FK
            modelBuilder.Entity<Order>()
                .HasOne(o => o.PromoCode)
                .WithMany()
                .HasForeignKey(o => o.PromoCodeId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Order>()
                .Property(o => o.DiscountAmount)
                .HasPrecision(18, 2);
        }
    }
}
