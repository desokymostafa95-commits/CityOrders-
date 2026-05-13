using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CityOrders.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerAppFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "BaseDeliveryFeeSnapshot",
                table: "Orders",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DistanceMeters",
                table: "Orders",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FeePerMeterSnapshot",
                table: "Orders",
                type: "decimal(18,6)",
                precision: 18,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MaxDeliveryFeeSnapshot",
                table: "Orders",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MinDeliveryFeeSnapshot",
                table: "Orders",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Lat",
                table: "CustomerAddresses",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Lng",
                table: "CustomerAddresses",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BaseDeliveryFee",
                table: "Brands",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "FeePerMeter",
                table: "Brands",
                type: "decimal(18,6)",
                precision: 18,
                scale: 6,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "MaxDeliveryDistanceMeters",
                table: "Brands",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MaxDeliveryFee",
                table: "Brands",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MinDeliveryFee",
                table: "Brands",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BaseDeliveryFeeSnapshot",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "DistanceMeters",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "FeePerMeterSnapshot",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "MaxDeliveryFeeSnapshot",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "MinDeliveryFeeSnapshot",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "Lat",
                table: "CustomerAddresses");

            migrationBuilder.DropColumn(
                name: "Lng",
                table: "CustomerAddresses");

            migrationBuilder.DropColumn(
                name: "BaseDeliveryFee",
                table: "Brands");

            migrationBuilder.DropColumn(
                name: "FeePerMeter",
                table: "Brands");

            migrationBuilder.DropColumn(
                name: "MaxDeliveryDistanceMeters",
                table: "Brands");

            migrationBuilder.DropColumn(
                name: "MaxDeliveryFee",
                table: "Brands");

            migrationBuilder.DropColumn(
                name: "MinDeliveryFee",
                table: "Brands");
        }
    }
}
