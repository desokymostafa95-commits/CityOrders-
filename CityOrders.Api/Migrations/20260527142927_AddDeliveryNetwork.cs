using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CityOrders.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDeliveryNetwork : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AgentType",
                table: "DeliveryProfiles",
                type: "int",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.AddColumn<decimal>(
                name: "CommissionPercent",
                table: "DeliveryProfiles",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "DeliveryProfiles",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "SYSUTCDATETIME()");

            migrationBuilder.AddColumn<int>(
                name: "DeliveryOfficeId",
                table: "DeliveryProfiles",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsAvailable",
                table: "DeliveryProfiles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "LastLat",
                table: "DeliveryProfiles",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "LastLng",
                table: "DeliveryProfiles",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastLocationAt",
                table: "DeliveryProfiles",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MerchantUserId",
                table: "DeliveryProfiles",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "DeliveryProfiles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "DeliveryProfiles",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VehicleType",
                table: "DeliveryProfiles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DeliveryOffices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ManagerUserId = table.Column<int>(type: "int", nullable: false),
                    DefaultCommissionPercent = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryOffices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeliveryOffices_Users_ManagerUserId",
                        column: x => x.ManagerUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DeliveryAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrderId = table.Column<int>(type: "int", nullable: false),
                    Source = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    AgentUserId = table.Column<int>(type: "int", nullable: true),
                    DeliveryOfficeId = table.Column<int>(type: "int", nullable: true),
                    DeliveryFeeSnapshot = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    OfficeCommissionPercent = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    OfficeCommissionAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    AgentEarningAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    AcceptedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PickedUpAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeliveredAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CancellationReason = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeliveryAssignments_DeliveryOffices_DeliveryOfficeId",
                        column: x => x.DeliveryOfficeId,
                        principalTable: "DeliveryOffices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DeliveryAssignments_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DeliveryAssignments_Users_AgentUserId",
                        column: x => x.AgentUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryProfiles_AgentType_IsActive_IsAvailable",
                table: "DeliveryProfiles",
                columns: new[] { "AgentType", "IsActive", "IsAvailable" });

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryProfiles_DeliveryOfficeId",
                table: "DeliveryProfiles",
                column: "DeliveryOfficeId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryProfiles_MerchantUserId",
                table: "DeliveryProfiles",
                column: "MerchantUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryAssignments_AgentUserId",
                table: "DeliveryAssignments",
                column: "AgentUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryAssignments_DeliveryOfficeId",
                table: "DeliveryAssignments",
                column: "DeliveryOfficeId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryAssignments_OrderId",
                table: "DeliveryAssignments",
                column: "OrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryAssignments_Status_Source_CreatedAt",
                table: "DeliveryAssignments",
                columns: new[] { "Status", "Source", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOffices_ManagerUserId",
                table: "DeliveryOffices",
                column: "ManagerUserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOffices_Name",
                table: "DeliveryOffices",
                column: "Name");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryProfiles_DeliveryOffices_DeliveryOfficeId",
                table: "DeliveryProfiles",
                column: "DeliveryOfficeId",
                principalTable: "DeliveryOffices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryProfiles_Users_MerchantUserId",
                table: "DeliveryProfiles",
                column: "MerchantUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryProfiles_DeliveryOffices_DeliveryOfficeId",
                table: "DeliveryProfiles");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryProfiles_Users_MerchantUserId",
                table: "DeliveryProfiles");

            migrationBuilder.DropTable(
                name: "DeliveryAssignments");

            migrationBuilder.DropTable(
                name: "DeliveryOffices");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryProfiles_AgentType_IsActive_IsAvailable",
                table: "DeliveryProfiles");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryProfiles_DeliveryOfficeId",
                table: "DeliveryProfiles");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryProfiles_MerchantUserId",
                table: "DeliveryProfiles");

            migrationBuilder.DropColumn(
                name: "AgentType",
                table: "DeliveryProfiles");

            migrationBuilder.DropColumn(
                name: "CommissionPercent",
                table: "DeliveryProfiles");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "DeliveryProfiles");

            migrationBuilder.DropColumn(
                name: "DeliveryOfficeId",
                table: "DeliveryProfiles");

            migrationBuilder.DropColumn(
                name: "IsAvailable",
                table: "DeliveryProfiles");

            migrationBuilder.DropColumn(
                name: "LastLat",
                table: "DeliveryProfiles");

            migrationBuilder.DropColumn(
                name: "LastLng",
                table: "DeliveryProfiles");

            migrationBuilder.DropColumn(
                name: "LastLocationAt",
                table: "DeliveryProfiles");

            migrationBuilder.DropColumn(
                name: "MerchantUserId",
                table: "DeliveryProfiles");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "DeliveryProfiles");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "DeliveryProfiles");

            migrationBuilder.DropColumn(
                name: "VehicleType",
                table: "DeliveryProfiles");
        }
    }
}
