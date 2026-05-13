using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CityOrders.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProductUnitSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BrandMasterCategories",
                columns: table => new
                {
                    BrandsId = table.Column<int>(type: "int", nullable: false),
                    MasterCategoriesId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BrandMasterCategories", x => new { x.BrandsId, x.MasterCategoriesId });
                    table.ForeignKey(
                        name: "FK_BrandMasterCategories_Brands_BrandsId",
                        column: x => x.BrandsId,
                        principalTable: "Brands",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BrandMasterCategories_Categories_MasterCategoriesId",
                        column: x => x.MasterCategoriesId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BrandMasterCategories_MasterCategoriesId",
                table: "BrandMasterCategories",
                column: "MasterCategoriesId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BrandMasterCategories");

            migrationBuilder.DropColumn(
                name: "AllowFractionalQuantity",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "QuantityStep",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "UnitType",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "DeliveryFeeType",
                table: "Brands");

            migrationBuilder.DropColumn(
                name: "FixedDeliveryFee",
                table: "Brands");

            migrationBuilder.DropColumn(
                name: "MaxVariableDeliveryFee",
                table: "Brands");

            migrationBuilder.DropColumn(
                name: "MinVariableDeliveryFee",
                table: "Brands");

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Brands",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
