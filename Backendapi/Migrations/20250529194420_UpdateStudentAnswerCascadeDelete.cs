using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backendapi.Migrations
{
    /// <inheritdoc />
    public partial class UpdateStudentAnswerCascadeDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudentAnswer_Assessment",
                table: "StudentAnswer");

            migrationBuilder.AddForeignKey(
                name: "FK_StudentAnswer_Assessment",
                table: "StudentAnswer",
                column: "AssessmentId",
                principalTable: "Assessment",
                principalColumn: "AssessmentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudentAnswer_Assessment",
                table: "StudentAnswer");

            migrationBuilder.AddForeignKey(
                name: "FK_StudentAnswer_Assessment",
                table: "StudentAnswer",
                column: "AssessmentId",
                principalTable: "Assessment",
                principalColumn: "AssessmentId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
