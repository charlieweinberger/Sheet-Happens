import { NextResponse } from "next/server";
import { moveRiderToCar } from "@/lib/eventStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    riderId: string;
    targetCarId: string;
    sheetId?: string;
  };

  const { riderId, targetCarId, sheetId } = body;

  try {
    const data = await moveRiderToCar(riderId, targetCarId, sheetId);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error moving rider:", error);
    return NextResponse.json(
      { error: "Failed to move rider" },
      { status: 500 },
    );
  }
}
