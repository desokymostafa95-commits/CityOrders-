using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CityOrders.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderCompositeIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Orders_BrandId_Status_DeliveredAt",
                table: "Orders",
                columns: new[] { "BrandId", "Status", "DeliveredAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Orders_BrandId_Status_DeliveredAt",
                table: "Orders");
        }
    }
}
