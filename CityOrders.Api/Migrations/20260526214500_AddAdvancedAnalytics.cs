using System;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CityOrders.Api.Migrations
{
    [Migration("20260526214500_AddAdvancedAnalytics")]
    [DbContext(typeof(AppDbContext))]
    public partial class AddAdvancedAnalytics : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MetadataJson",
                table: "AnalyticsEvents",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SearchTerm",
                table: "AnalyticsEvents",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MerchantDailyAnalytics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BrandId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    StoreViews = table.Column<int>(type: "int", nullable: false),
                    UniqueStoreVisitors = table.Column<int>(type: "int", nullable: false),
                    ProductViews = table.Column<int>(type: "int", nullable: false),
                    UniqueProductViewers = table.Column<int>(type: "int", nullable: false),
                    AddToCartEvents = table.Column<int>(type: "int", nullable: false),
                    CheckoutStartedEvents = table.Column<int>(type: "int", nullable: false),
                    Searches = table.Column<int>(type: "int", nullable: false),
                    Orders = table.Column<int>(type: "int", nullable: false),
                    AbandonedCarts = table.Column<int>(type: "int", nullable: false),
                    Revenue = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    PromoDiscount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchantDailyAnalytics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchantDailyAnalytics_Brands_BrandId",
                        column: x => x.BrandId,
                        principalTable: "Brands",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnalyticsEvents_BrandId_SearchTerm_CreatedAt",
                table: "AnalyticsEvents",
                columns: new[] { "BrandId", "SearchTerm", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_MerchantDailyAnalytics_BrandId_Date",
                table: "MerchantDailyAnalytics",
                columns: new[] { "BrandId", "Date" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "MerchantDailyAnalytics");

            migrationBuilder.DropIndex(
                name: "IX_AnalyticsEvents_BrandId_SearchTerm_CreatedAt",
                table: "AnalyticsEvents");

            migrationBuilder.DropColumn(
                name: "MetadataJson",
                table: "AnalyticsEvents");

            migrationBuilder.DropColumn(
                name: "SearchTerm",
                table: "AnalyticsEvents");
        }
    }
}
