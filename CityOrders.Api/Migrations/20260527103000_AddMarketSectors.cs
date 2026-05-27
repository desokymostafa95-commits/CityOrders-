using System;
using CityOrders.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CityOrders.Api.Migrations
{
    [Migration("20260527103000_AddMarketSectors")]
    [DbContext(typeof(AppDbContext))]
    public partial class AddMarketSectors : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MarketSectors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IconKey = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    ImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketSectors", x => x.Id);
                });

            var seededAt = new DateTime(2026, 5, 27, 0, 0, 0, DateTimeKind.Utc);

            migrationBuilder.InsertData(
                table: "MarketSectors",
                columns: new[] { "Id", "Name", "Slug", "Description", "IconKey", "SortOrder", "IsActive", "UpdatedAt" },
                columnTypes: new[] { "int", "nvarchar(100)", "nvarchar(120)", "nvarchar(500)", "nvarchar(80)", "int", "bit", "datetime2" },
                values: new object[,]
                {
                    { 1, "Food & Restaurants", "food", "Restaurants, groceries, drinks, and ready-to-order food.", "food", 10, true, seededAt },
                    { 2, "Fashion", "fashion", "Clothing, shoes, accessories, and style stores.", "tshirt", 20, true, seededAt },
                    { 3, "Mobiles", "mobiles", "Phones, accessories, repairs, and mobile services.", "smartphone", 30, true, seededAt },
                    { 4, "Computers", "computers", "Laptops, PCs, parts, monitors, and peripherals.", "laptop", 40, true, seededAt },
                    { 5, "Home Appliances", "appliances", "Appliances, electronics, and home devices.", "appliance", 50, true, seededAt },
                    { 6, "Pharmacy & Health", "pharmacy-health", "Pharmacies, health products, and personal care.", "medical", 60, true, seededAt }
                });

            migrationBuilder.AddColumn<int>(
                name: "MarketSectorId",
                table: "Categories",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "MarketSectorId",
                table: "Brands",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateIndex(
                name: "IX_MarketSectors_Slug",
                table: "MarketSectors",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Categories_MarketSectorId_SortOrder",
                table: "Categories",
                columns: new[] { "MarketSectorId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_Brands_MarketSectorId",
                table: "Brands",
                column: "MarketSectorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Categories_MarketSectors_MarketSectorId",
                table: "Categories",
                column: "MarketSectorId",
                principalTable: "MarketSectors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Brands_MarketSectors_MarketSectorId",
                table: "Brands",
                column: "MarketSectorId",
                principalTable: "MarketSectors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Brands_MarketSectors_MarketSectorId",
                table: "Brands");

            migrationBuilder.DropForeignKey(
                name: "FK_Categories_MarketSectors_MarketSectorId",
                table: "Categories");

            migrationBuilder.DropIndex(
                name: "IX_Brands_MarketSectorId",
                table: "Brands");

            migrationBuilder.DropIndex(
                name: "IX_Categories_MarketSectorId_SortOrder",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "MarketSectorId",
                table: "Brands");

            migrationBuilder.DropColumn(
                name: "MarketSectorId",
                table: "Categories");

            migrationBuilder.DropTable(name: "MarketSectors");
        }
    }
}
