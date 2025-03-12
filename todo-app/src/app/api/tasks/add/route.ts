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

interface TaskInput {
  title: string;
  description: string;
  status: string;
  created_by: Number;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const { title, description, status, created_by }: TaskInput =
      await req.json();

    const created_at: string = getWIBTime();

    const usersQuery = `SELECT role FROM users WHERE id = $1`;
    const usersValue = [created_by];
    const usersResult = await handlerQuery(usersQuery, usersValue);
    const usersRole = usersResult.rows[0].role;

    await handlerQuery("BEGIN", []);

    try {
      // Insert task
      const insertTaskQuery = `
        INSERT INTO tasks (title, description, status, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
      const taskValues = [title, description, status, created_by, created_at];
      const taskResult = await handlerQuery(insertTaskQuery, taskValues);
      const taskId = taskResult.rows[0].id;

      // Log the task creation
      const logQuery = `
        INSERT INTO task_log (id_task, updated_by, new_status, new_desc, updated_at, status, new_title, previous_title, previous_desc, previous_status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;
      const logValues = [
        taskId,
        usersRole,
        null,
        null,
        null,
        "Task Created",
        null,
        title,
        description,
        status,
        created_at,
      ];
      await handlerQuery(logQuery, logValues);

      // Commit transaction
      await handlerQuery("COMMIT", []);

      return NextResponse.json(
        {
          success: true,
          data: {
            id: taskId,
            title,
            description,
            status,
            created_by,
            created_at,
          },
        },
        { status: 200 }
      );
    } catch (error) {
      // Rollback transaction in case of error
      await handlerQuery("ROLLBACK", []);
      throw error;
    }
  } catch (error) {
    console.error("Error inserting task:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add task" },
      { status: 500 }
    );
  }
}
