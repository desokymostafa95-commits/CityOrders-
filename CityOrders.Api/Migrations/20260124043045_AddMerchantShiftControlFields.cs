using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CityOrders.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMerchantShiftControlFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsOnShift",
                table: "MerchantProfiles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ShiftAutoCloseAt",
                table: "MerchantProfiles",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ShiftAutoClosedBySystemAt",
                table: "MerchantProfiles",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ShiftUpdatedAt",
                table: "MerchantProfiles",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsOnShift",
                table: "MerchantProfiles");

            migrationBuilder.DropColumn(
                name: "ShiftAutoCloseAt",
                table: "MerchantProfiles");

            migrationBuilder.DropColumn(
                name: "ShiftAutoClosedBySystemAt",
                table: "MerchantProfiles");

            migrationBuilder.DropColumn(
                name: "ShiftUpdatedAt",
                table: "MerchantProfiles");
        }
    }
}
