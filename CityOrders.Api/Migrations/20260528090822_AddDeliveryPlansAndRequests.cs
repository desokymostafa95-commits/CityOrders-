using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CityOrders.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDeliveryPlansAndRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DeliveryPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    PriceEgp = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    DurationDays = table.Column<int>(type: "int", nullable: false),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryPlans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DeliveryPaymentRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AgentUserId = table.Column<int>(type: "int", nullable: false),
                    PlanId = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ProofFilePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    PayerNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    AdminNotes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ReviewedByUserId = table.Column<int>(type: "int", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryPaymentRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeliveryPaymentRequests_DeliveryPlans_PlanId",
                        column: x => x.PlanId,
                        principalTable: "DeliveryPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DeliveryPaymentRequests_Users_AgentUserId",
                        column: x => x.AgentUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DeliveryPaymentRequests_Users_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
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
                name: "IX_DeliveryPaymentRequests_AgentUserId_Status",
                table: "DeliveryPaymentRequests",
                columns: new[] { "AgentUserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryPaymentRequests_PlanId",
                table: "DeliveryPaymentRequests",
                column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryPaymentRequests_ReviewedByUserId",
                table: "DeliveryPaymentRequests",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryPaymentRequests_Status",
                table: "DeliveryPaymentRequests",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DeliveryPaymentRequests");

            migrationBuilder.DropTable(
                name: "DeliveryPlans");
        }
    }
}
