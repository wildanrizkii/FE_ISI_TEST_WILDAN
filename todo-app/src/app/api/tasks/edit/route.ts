import { NextResponse } from "next/server";
import handlerQuery from "@/app/utils/db";

export async function PUT(req: Request): Promise<NextResponse> {
  try {
    const { id, title, description, status } = await req.json();

    if (!id || !title.trim() || !description.trim()) {
      return NextResponse.json(
        { success: false, error: "Invalid input" },
        { status: 400 }
      );
    }

    const query = `
      UPDATE tasks
      SET title = $1, description = $2, status = $3
      WHERE id = $4
    `;

    const values = [title, description, status, id];
    const updatedTask = await handlerQuery(query, values);

    if (updatedTask.length === 0) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedTask[0] });
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating task", details: error },
      { status: 500 }
    );
  }
}
