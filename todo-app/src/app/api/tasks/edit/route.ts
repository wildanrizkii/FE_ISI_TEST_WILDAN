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

export async function PUT(req: Request): Promise<NextResponse> {
  try {
    const { id, title, description, status, updated_by } = await req.json();

    if (!id || !title.trim() || !description.trim()) {
      return NextResponse.json(
        { success: false, error: "Invalid input" },
        { status: 400 }
      );
    }

    const updated_at: string = getWIBTime();

    // Begin transaction
    await handlerQuery("BEGIN", []);

    try {
      // Ambil data task sebelum diupdate
      const previousTaskQuery = `SELECT title, description, status FROM tasks WHERE id = $1`;
      const previousTaskResult = await handlerQuery(previousTaskQuery, [id]);

      if (previousTaskResult.rows.length === 0) {
        await handlerQuery("ROLLBACK", []);
        return NextResponse.json(
          { success: false, error: "Task not found" },
          { status: 404 }
        );
      }

      const previousTask = previousTaskResult.rows[0];

      // Update task
      const updateTaskQuery = `
        UPDATE tasks
        SET title = $1, description = $2, status = $3
        WHERE id = $4
        RETURNING id
      `;
      const taskValues = [title, description, status, id];
      const updatedTask = await handlerQuery(updateTaskQuery, taskValues);

      if (updatedTask.rows.length === 0) {
        await handlerQuery("ROLLBACK", []);
        return NextResponse.json(
          { success: false, error: "Task not found" },
          { status: 404 }
        );
      }

      // Insert log into task_log dengan data sebelumnya
      const logQuery = `
        INSERT INTO task_log (id_task, updated_by, new_status, new_desc, updated_at, status, new_title, previous_title, previous_desc, previous_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;
      const logValues = [
        id,
        updated_by,
        status, // new_status
        description, // new_desc
        updated_at,
        "Task Updated",
        title, // new_title
        previousTask.title, // previous_title
        previousTask.description, // previous_desc
        previousTask.status, // previous_status
      ];
      await handlerQuery(logQuery, logValues);

      // Commit transaction
      await handlerQuery("COMMIT", []);

      return NextResponse.json(
        {
          success: true,
          data: {
            id,
            title,
            description,
            status,
            updated_by,
            updated_at,
          },
        },
        { status: 200 }
      );
    } catch (error) {
      // Rollback transaction if error occurs
      await handlerQuery("ROLLBACK", []);
      throw error;
    }
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update task" },
      { status: 500 }
    );
  }
}
