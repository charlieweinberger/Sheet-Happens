import { NextResponse } from "next/server";
import { getEventData } from "@/lib/eventStore";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sheetId = url.searchParams.get("sheetId") ?? undefined;
  const data = await getEventData(sheetId);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { sheetId?: string };
  const data = await getEventData(body.sheetId);
  return NextResponse.json(data);
}
