import { NextResponse } from "next/server";
import { autoAssignCars } from "@/lib/eventStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    prioritizeOfficers?: boolean;
    assignmentScope?: "all" | "confirmed" | "present";
    sheetId?: string;
  };

  const data = await autoAssignCars(
    Boolean(body.prioritizeOfficers ?? true),
    body.sheetId,
    body.assignmentScope ?? "all",
  );
  return NextResponse.json(data);
}
