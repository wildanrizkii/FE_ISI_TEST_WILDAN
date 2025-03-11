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

    const query = `
        INSERT INTO tasks (title, description, status, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5)
      `;

    const values = [title, description, status, created_by, created_at];
    await handlerQuery(query, values);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error inserting task:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add task" },
      { status: 500 }
    );
  }
}
