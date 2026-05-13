using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CityOrders.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMerchantInvoices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DeliveredAt",
                table: "Orders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MerchantShifts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BrandId = table.Column<int>(type: "int", nullable: false),
                    InvoiceNumber = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    StartAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ClosedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    DeliveredOrdersCount = table.Column<int>(type: "int", nullable: false),
                    GrossSales = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    BrandNameSnapshot = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BrandAddressSnapshot = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BrandPhoneSnapshot = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PdfUrl = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchantShifts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchantShifts_Brands_BrandId",
                        column: x => x.BrandId,
                        principalTable: "Brands",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MerchantShiftLines",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MerchantShiftId = table.Column<int>(type: "int", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: true),
                    ProductNameSnapshot = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UnitPriceSnapshot = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    LineTotal = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchantShiftLines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchantShiftLines_MerchantShifts_MerchantShiftId",
                        column: x => x.MerchantShiftId,
                        principalTable: "MerchantShifts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MerchantShiftLines_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "MerchantShiftOrders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MerchantShiftId = table.Column<int>(type: "int", nullable: false),
                    OrderId = table.Column<int>(type: "int", nullable: false),
                    OrderNumberSnapshot = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TotalSnapshot = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    DeliveredAtSnapshot = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MerchantShiftOrders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MerchantShiftOrders_MerchantShifts_MerchantShiftId",
                        column: x => x.MerchantShiftId,
                        principalTable: "MerchantShifts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MerchantShiftOrders_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MerchantShiftLines_MerchantShiftId",
                table: "MerchantShiftLines",
                column: "MerchantShiftId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantShiftLines_ProductId",
                table: "MerchantShiftLines",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantShiftOrders_MerchantShiftId",
                table: "MerchantShiftOrders",
                column: "MerchantShiftId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantShiftOrders_OrderId",
                table: "MerchantShiftOrders",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantShifts_BrandId",
                table: "MerchantShifts",
                column: "BrandId");

            migrationBuilder.CreateIndex(
                name: "IX_MerchantShifts_InvoiceNumber",
                table: "MerchantShifts",
                column: "InvoiceNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MerchantShifts_Status",
                table: "MerchantShifts",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MerchantShiftLines");

            migrationBuilder.DropTable(
                name: "MerchantShiftOrders");

            migrationBuilder.DropTable(
                name: "MerchantShifts");

            migrationBuilder.DropColumn(
                name: "DeliveredAt",
                table: "Orders");
        }
    }
}
