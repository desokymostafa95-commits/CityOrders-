using CityOrders.Api.Infrastructure.Data;
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
        .FirstOrDefaultAsync(u => u.Email == "merchant@cityorders.local");

    if (merchant != null) {
        Console.WriteLine($"Merchant ID: {merchant.Id}");
        Console.WriteLine($"IsApproved: {merchant.MerchantProfile?.IsApproved}");
        Console.WriteLine($"IsActive: {merchant.MerchantProfile?.IsActive}");
    } else {
        Console.WriteLine("Merchant not found");
    }
    
    var order = await context.Orders.FirstOrDefaultAsync(o => o.Id == 1);
    if (order != null) {
        Console.WriteLine($"Order 1 Status: {order.Status}");
        Console.WriteLine($"Order 1 BrandId: {order.BrandId}");
    } else {
        Console.WriteLine("Order 1 not found");
    }
}
