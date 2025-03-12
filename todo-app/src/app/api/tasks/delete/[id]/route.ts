import { NextResponse } from "next/server";
import handlerQuery from "@/app/utils/db";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const getWIBTime = (): string => {
  return dayjs().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");
};

export async function DELETE(
  req: Request,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const { id } = params;

    const updated_at: string = getWIBTime();
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      );
    }

    const selectQuery = `
      SELECT title, description, status FROM tasks WHERE id = $1;
    `;
    const valuesSelect = [id];
    const taskData = await handlerQuery(selectQuery, valuesSelect);

    const { title, description, status } = taskData.rows[0];

    const logQuery = `
        INSERT INTO task_log (id_task, new_status, new_desc, updated_at, status, new_title)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
    const logValues = [
      id,
      status,
      description,
      updated_at,
      "Task Deleted",
      title,
    ];
    await handlerQuery(logQuery, logValues);

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
