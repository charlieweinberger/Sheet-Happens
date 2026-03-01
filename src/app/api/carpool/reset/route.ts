import { NextResponse } from "next/server";
import { resetCarpool } from "@/lib/eventStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    sheetId?: string;
  };

  const data = await resetCarpool(body.sheetId);
  return NextResponse.json(data);
}
