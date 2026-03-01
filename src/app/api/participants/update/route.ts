import { NextResponse } from "next/server";
import {
  updateParticipantDriverStatus,
  updateParticipantSeats,
  updateParticipantStatus,
} from "@/lib/eventStore";
import type { EventStatus } from "@/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    participantId: string;
    driverStatus?: { isDriver: boolean; isSelfDriver: boolean };
    seats?: number;
    status?: EventStatus;
    sheetId?: string;
  };

  const { participantId, driverStatus, seats, status, sheetId } = body;

  try {
    let data;

    // Handle driver status update
    if (driverStatus) {
      data = await updateParticipantDriverStatus(
        participantId,
        driverStatus.isDriver,
        driverStatus.isSelfDriver,
        sheetId,
      );
    }

    // Handle seats update
    if (seats !== undefined) {
      data = await updateParticipantSeats(participantId, seats, sheetId);
    }

    // Handle status update
    if (status) {
      data = await updateParticipantStatus(participantId, status, sheetId);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating participant:", error);
    return NextResponse.json(
      { error: "Failed to update participant" },
      { status: 500 },
    );
  }
}
