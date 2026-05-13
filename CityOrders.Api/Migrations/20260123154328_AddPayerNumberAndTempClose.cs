using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CityOrders.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPayerNumberAndTempClose : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PayerNumber",
                table: "SubscriptionPaymentRequests",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsTemporarilyClosed",
                table: "MerchantProfiles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TemporaryCloseReason",
                table: "MerchantProfiles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TemporaryCloseUntil",
                table: "MerchantProfiles",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PayerNumber",
                table: "SubscriptionPaymentRequests");

            migrationBuilder.DropColumn(
                name: "IsTemporarilyClosed",
                table: "MerchantProfiles");

            migrationBuilder.DropColumn(
                name: "TemporaryCloseReason",
                table: "MerchantProfiles");

            migrationBuilder.DropColumn(
                name: "TemporaryCloseUntil",
                table: "MerchantProfiles");
        }
    }
}
