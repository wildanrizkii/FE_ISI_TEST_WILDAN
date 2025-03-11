import { NextResponse } from "next/server";
import handlerQuery from "@/app/utils/db";

export async function DELETE(
  req: Request,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      );
    }

    const query = `
      DELETE FROM tasks
      WHERE id = $1
      RETURNING *;
    `;

    const values = [id];
    const deletedTask = await handlerQuery(query, values);

    if (deletedTask.length === 0) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting task", details: error },
      { status: 500 }
    );
  }
}
