using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CityOrders.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddChatThreadBlocking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsBlockedByCustomer",
                table: "ChatThreads",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsBlockedByMerchant",
                table: "ChatThreads",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsBlockedByCustomer",
                table: "ChatThreads");

            migrationBuilder.DropColumn(
                name: "IsBlockedByMerchant",
                table: "ChatThreads");
        }
    }
}
