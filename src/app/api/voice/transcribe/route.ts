import { NextResponse } from "next/server";
import { parseVoiceCommand } from "@/lib/aiInsights";
import { syncFromSheet } from "@/lib/eventStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      text?: string;
      sheetId?: string;
    };

    const text = body.text?.trim();
    const sheetId = body.sheetId;

    if (!text) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 },
      );
    }

    const participants = await syncFromSheet(sheetId);
    const command = parseVoiceCommand(text, participants);

    return NextResponse.json({
      transcript: text,
      command,
    });
  } catch (error) {
    console.error("Voice command interpretation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Voice command failed: ${errorMessage}` },
      { status: 500 },
    );
  }
}
