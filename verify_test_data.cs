using CityOrders.Api.Infrastructure.Data;
using CityOrders.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=CityOrdersDb;Trusted_Connection=True;MultipleActiveResultSets=true"));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    
    var merchant = await context.Users
        .Include(u => u.MerchantProfile)
        .Include(u => u.Brands)
        .FirstOrDefaultAsync(u => u.Email == "merchant@cityorders.local");

    if (merchant == null) {
        Console.WriteLine("Merchant not found");
        return;
    }

    Console.WriteLine($"Merchant ID: {merchant.Id}");
    Console.WriteLine($"Brand ID: {merchant.Brands.FirstOrDefault()?.Id}");

    // Check subscription
    var sub = await context.MerchantSubscriptions
        .FirstOrDefaultAsync(s => s.UserId == merchant.Id);

    if (sub == null) {
        Console.WriteLine("Adding subscription for merchant...");
        var plan = await context.SubscriptionPlans.FirstOrDefaultAsync();
        if (plan == null) {
            plan = new SubscriptionPlan { Name = "Basic", PriceEgp = 100, DurationDays = 30 };
            context.SubscriptionPlans.Add(plan);
            await context.SaveChangesAsync();
        }
        
        context.MerchantSubscriptions.Add(new MerchantSubscription {
            UserId = merchant.Id,
            PlanId = plan.Id,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30),
            GraceEndDate = DateTime.UtcNow.AddDays(37)
        });
        await context.SaveChangesAsync();
        Console.WriteLine("Subscription added.");
    } else {
        Console.WriteLine("Merchant already has a subscription.");
    }
}
