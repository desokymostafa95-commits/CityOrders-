using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CityOrders.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDeliveryCollectionSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AgentCollectionCycleDays",
                table: "DeliveryOffices",
                type: "int",
                nullable: false,
                defaultValue: 7);

            migrationBuilder.AddColumn<string>(
                name: "AgentCollectionMethodsJson",
                table: "DeliveryOffices",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: false,
                defaultValue: "[\"Cash\",\"Instapay\",\"COD\"]");

            migrationBuilder.AddColumn<DateTime>(
                name: "CollectedAt",
                table: "DeliveryAssignments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CollectedByUserId",
                table: "DeliveryAssignments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CollectionAmount",
                table: "DeliveryAssignments",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CollectionCycleDays",
                table: "DeliveryAssignments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CollectionDueAt",
                table: "DeliveryAssignments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CollectionMethod",
                table: "DeliveryAssignments",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CollectionMethodsSnapshot",
                table: "DeliveryAssignments",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CollectionRecipient",
                table: "DeliveryAssignments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CollectionStatus",
                table: "DeliveryAssignments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "PlatformCommissionAmount",
                table: "DeliveryAssignments",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PlatformCommissionPercent",
                table: "DeliveryAssignments",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DeliveryPlatformSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IndependentPlatformCommissionPercent = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    IndependentCollectionCycleDays = table.Column<int>(type: "int", nullable: false, defaultValue: 7),
                    IndependentCollectionMethodsJson = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false, defaultValue: "[\"Cash\",\"Instapay\",\"COD\"]"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryPlatformSettings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryAssignments_CollectedByUserId",
                table: "DeliveryAssignments",
                column: "CollectedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryAssignments_Users_CollectedByUserId",
                table: "DeliveryAssignments",
                column: "CollectedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryAssignments_Users_CollectedByUserId",
                table: "DeliveryAssignments");

            migrationBuilder.DropTable(
                name: "DeliveryPlatformSettings");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryAssignments_CollectedByUserId",
                table: "DeliveryAssignments");

            migrationBuilder.DropColumn(
                name: "AgentCollectionCycleDays",
                table: "DeliveryOffices");

            migrationBuilder.DropColumn(
                name: "AgentCollectionMethodsJson",
                table: "DeliveryOffices");

            migrationBuilder.DropColumn(
                name: "CollectedAt",
                table: "DeliveryAssignments");

            migrationBuilder.DropColumn(
                name: "CollectedByUserId",
                table: "DeliveryAssignments");

            migrationBuilder.DropColumn(
                name: "CollectionAmount",
                table: "DeliveryAssignments");

            migrationBuilder.DropColumn(
                name: "CollectionCycleDays",
                table: "DeliveryAssignments");

            migrationBuilder.DropColumn(
                name: "CollectionDueAt",
                table: "DeliveryAssignments");

            migrationBuilder.DropColumn(
                name: "CollectionMethod",
                table: "DeliveryAssignments");

            migrationBuilder.DropColumn(
                name: "CollectionMethodsSnapshot",
                table: "DeliveryAssignments");

            migrationBuilder.DropColumn(
                name: "CollectionRecipient",
                table: "DeliveryAssignments");

            migrationBuilder.DropColumn(
                name: "CollectionStatus",
                table: "DeliveryAssignments");

            migrationBuilder.DropColumn(
                name: "PlatformCommissionAmount",
                table: "DeliveryAssignments");

            migrationBuilder.DropColumn(
                name: "PlatformCommissionPercent",
                table: "DeliveryAssignments");
        }
    }
}
