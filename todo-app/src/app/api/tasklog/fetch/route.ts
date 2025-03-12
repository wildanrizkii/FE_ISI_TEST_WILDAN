import { NextResponse } from "next/server";
import handlerQuery from "@/app/utils/db";

export async function GET(): Promise<NextResponse> {
  try {
    const query: string = `
        SELECT * FROM task_log
      `;

    const values: (number | null)[] = [];

    const data = await handlerQuery(query, values);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: "Error route", details: error },
      { status: 500 }
    );
  }
}
