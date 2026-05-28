using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CityOrders.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveDeliveryPlans : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryPaymentRequests_DeliveryPlans_PlanId",
                table: "DeliveryPaymentRequests");

            migrationBuilder.DropTable(
                name: "DeliveryPlans");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryPaymentRequests_PlanId",
                table: "DeliveryPaymentRequests");

            migrationBuilder.DropColumn(
                name: "PlanId",
                table: "DeliveryPaymentRequests");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PlanId",
                table: "DeliveryPaymentRequests",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "DeliveryPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    DurationDays = table.Column<int>(type: "int", nullable: false),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    PriceEgp = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryPlans", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "DeliveryPlans",
                columns: new[] { "Id", "CreatedAt", "Description", "DurationDays", "IsEnabled", "Name", "PriceEgp", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 5, 28, 9, 8, 21, 692, DateTimeKind.Utc).AddTicks(1535), "Settle your cash balance weekly for a flat fee.", 7, true, "Weekly Settlement Plan", 150m, null },
                    { 2, new DateTime(2026, 5, 28, 9, 8, 21, 692, DateTimeKind.Utc).AddTicks(3283), "Settle your cash balance monthly for a discounted flat fee.", 30, true, "Monthly Settlement Plan", 500m, null },
                    { 3, new DateTime(2026, 5, 28, 9, 8, 21, 692, DateTimeKind.Utc).AddTicks(3287), "Manual custom settlement option.", 1, true, "Custom Settlement Plan", 0m, null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryPaymentRequests_PlanId",
                table: "DeliveryPaymentRequests",
                column: "PlanId");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryPaymentRequests_DeliveryPlans_PlanId",
                table: "DeliveryPaymentRequests",
                column: "PlanId",
                principalTable: "DeliveryPlans",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
