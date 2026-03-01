import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { cars, participantState } from "@/lib/db/schema";
import { fetchSheetParticipants } from "@/lib/googleSheets";
import { generateMockInsights } from "@/lib/aiInsights";
import { optimizeCarpoolAssignments } from "@/lib/carpoolOptimizer";
import { isOfficerEmail } from "@/lib/config";
import type {
  DashboardStats,
  EventData,
  EventStatus,
  Participant,
} from "@/types";

function toParticipant(
  sheet: Awaited<ReturnType<typeof fetchSheetParticipants>>[number],
  local?: {
    status: string;
    isOfficer: boolean;
    appNotes: string;
    preferredRidePartners: string;
    driver: boolean | null;
    selfDriver: boolean | null;
    seats: number | null;
    carId: string | null;
    seatIndex: number | null;
    checkInState: string | null;
  },
): Participant {
  // Auto-determine officer status based on email
  const isOfficer = isOfficerEmail(sheet.email);

  // Parse preferredRidePartners from database (comma-separated string) or use sheet value
  const preferredRidePartners = local?.preferredRidePartners
    ? local.preferredRidePartners
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : sheet.preferredRidePartners;

  // Use database driver/selfDriver if available, otherwise use sheet value
  const driver = local?.driver !== null && local?.driver !== undefined
    ? Boolean(local.driver)
    : sheet.driver;
  const selfDriver = local?.selfDriver !== null && local?.selfDriver !== undefined
    ? Boolean(local.selfDriver)
    : sheet.selfDriver;

  // Use database seats if available, otherwise use sheet value
  const seats = local?.seats !== null && local?.seats !== undefined
    ? local.seats
    : sheet.seats;

  return {
    ...sheet,
    driver,
    selfDriver,
    seats,
    preferredRidePartners,
    status: (local?.status as EventStatus) ?? "awaiting",
    isOfficer,
    appNotes: local?.appNotes ?? "",
    carId: local?.carId ?? null,
    seatIndex: local?.seatIndex ?? null,
    checkInState: (local?.checkInState as Participant["checkInState"]) ?? null,
  };
}

function normalizeSeatIndexes(participants: Participant[]) {
  const normalized = participants.map((participant) => ({ ...participant }));
  const byId = new Map(
    normalized.map((participant) => [participant.id, participant]),
  );

  const drivers = normalized.filter(
    (participant) =>
      participant.driver && !participant.selfDriver && participant.seats > 0,
  );

  for (const driver of drivers) {
    const carId = `car-${driver.id}`;
    const seatsTotal = driver.seats;
    const seatOccupants: Array<string | null> = Array.from(
      { length: seatsTotal },
      () => null,
    );

    const ridersInCar = normalized.filter(
      (participant) => !participant.driver && participant.carId === carId,
    );

    for (const rider of ridersInCar) {
      if (
        rider.seatIndex !== null &&
        rider.seatIndex >= 0 &&
        rider.seatIndex < seatsTotal &&
        seatOccupants[rider.seatIndex] === null
      ) {
        seatOccupants[rider.seatIndex] = rider.id;
      }
    }

    for (const rider of ridersInCar) {
      if (seatOccupants.includes(rider.id)) continue;

      const nextOpenSeat = seatOccupants.findIndex((seat) => seat === null);
      if (nextOpenSeat === -1) {
        rider.carId = null;
        rider.seatIndex = null;
        continue;
      }

      rider.seatIndex = nextOpenSeat;
      seatOccupants[nextOpenSeat] = rider.id;
    }

    for (const riderId of seatOccupants) {
      if (!riderId) continue;
      const rider = byId.get(riderId);
      if (!rider) continue;
      if (rider.carId !== carId) continue;
      if (
        rider.seatIndex === null ||
        rider.seatIndex < 0 ||
        rider.seatIndex >= seatsTotal
      ) {
        rider.seatIndex = seatOccupants.indexOf(riderId);
      }
    }
  }

  return normalized;
}

export async function syncFromSheet() {
  const sheetParticipants = await fetchSheetParticipants();

  for (const participant of sheetParticipants) {
    const existing = await db
      .select()
      .from(participantState)
      .where(eq(participantState.participantId, participant.id));

    if (existing.length === 0) {
      await db.insert(participantState).values({
        participantId: participant.id,
        email: participant.email,
        status: "awaiting",
        isOfficer: false,
        appNotes: "",
        preferredRidePartners: participant.preferredRidePartners.join(", "),
        driver: participant.driver,
        selfDriver: participant.selfDriver,
        seats: participant.seats,
        carId: null,
        seatIndex: null,
        checkInState: null,
        updatedAt: new Date(),
      });
    } else {
      // Backfill preferredRidePartners from sheet if DB has empty string
      if (
        existing[0].preferredRidePartners === "" &&
        participant.preferredRidePartners.length > 0
      ) {
        await db
          .update(participantState)
          .set({
            preferredRidePartners: participant.preferredRidePartners.join(", "),
            updatedAt: new Date(),
          })
          .where(eq(participantState.participantId, participant.id));
      }
      // Backfill seats from sheet if DB has null
      if (
        (existing[0].seats === null || existing[0].seats === undefined) &&
        participant.seats !== null &&
        participant.seats !== undefined
      ) {
        await db
          .update(participantState)
          .set({
            seats: participant.seats,
            updatedAt: new Date(),
          })
          .where(eq(participantState.participantId, participant.id));
      }
      // Backfill driver/selfDriver from sheet if DB has null
      if (
        (existing[0].driver === null || existing[0].driver === undefined) &&
        participant.driver !== null &&
        participant.driver !== undefined
      ) {
        await db
          .update(participantState)
          .set({
            driver: participant.driver,
            selfDriver: participant.selfDriver,
            updatedAt: new Date(),
          })
          .where(eq(participantState.participantId, participant.id));
      }
    }
  }

  const locals = await db.select().from(participantState);
  const localById = new Map(locals.map((row) => [row.participantId, row]));

  const mergedParticipants = sheetParticipants.map((sheet) =>
    toParticipant(sheet, localById.get(sheet.id)),
  );

  return normalizeSeatIndexes(mergedParticipants);
}

function buildCars(participants: Participant[]) {
  const driverCars = participants
    .filter(
      (p) =>
        p.driver && !p.selfDriver && p.status !== "cancelled" && p.seats > 0,
    )
    .map((driver) => {
      const seatAssignments: Array<string | null> = Array.from(
        { length: driver.seats },
        () => null,
      );

      const assignedRiders = participants.filter(
        (p) => !p.driver && p.carId === `car-${driver.id}`,
      );

      for (const rider of assignedRiders) {
        if (
          rider.seatIndex !== null &&
          rider.seatIndex >= 0 &&
          rider.seatIndex < seatAssignments.length &&
          !seatAssignments[rider.seatIndex]
        ) {
          seatAssignments[rider.seatIndex] = rider.id;
        }
      }

      for (const rider of assignedRiders) {
        if (seatAssignments.includes(rider.id)) continue;

        const nextOpenSeat = seatAssignments.findIndex((seat) => seat === null);
        if (nextOpenSeat !== -1) {
          seatAssignments[nextOpenSeat] = rider.id;
        }
      }

      const riderIds = seatAssignments.filter(
        (seat): seat is string => seat !== null,
      );

      return {
        id: `car-${driver.id}`,
        driverId: driver.id,
        driverName: driver.name,
        seatsTotal: driver.seats,
        seatsUsed: riderIds.length,
        riderIds,
        seatAssignments,
      };
    });

  return driverCars;
}

function buildStats(participants: Participant[]): DashboardStats {
  const totalSignedUp = participants.length;
  const confirmed = participants.filter((p) => p.status === "confirmed").length;
  const cancelled = participants.filter((p) => p.status === "cancelled").length;
  const awaitingResponse = participants.filter(
    (p) => p.status === "awaiting",
  ).length;
  const carsCreated = participants.filter(
    (p) => p.driver && !p.selfDriver && p.seats > 0,
  ).length;
  const officersAttending = participants.filter(
    (p) => p.isOfficer && p.status !== "cancelled",
  ).length;

  return {
    totalSignedUp,
    confirmed,
    cancelled,
    awaitingResponse,
    carsCreated,
    officersAttending,
  };
}

export async function getEventData(): Promise<EventData> {
  const participants = await syncFromSheet();
  const cars = buildCars(participants);
  const stats = buildStats(participants);
  const insights = generateMockInsights(participants);

  return { participants, cars, stats, insights };
}

export async function updateParticipantState(
  participantId: string,
  updates: Partial<{
    status: EventStatus;
    isOfficer: boolean;
    appNotes: string;
    preferredRidePartners: string[];
    driver: boolean;
    selfDriver: boolean;
    seats: number;
    carId: string | null;
    seatIndex: number | null;
    checkInState: Participant["checkInState"];
  }>,
) {
  // Fetch current participant to check if this is a driver being uncancelled
  const [currentParticipant] = await db
    .select()
    .from(participantState)
    .where(eq(participantState.participantId, participantId));

  const payload: Partial<typeof participantState.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (typeof updates.status !== "undefined") payload.status = updates.status;
  if (typeof updates.isOfficer !== "undefined")
    payload.isOfficer = updates.isOfficer;
  if (typeof updates.appNotes !== "undefined")
    payload.appNotes = updates.appNotes;
  if (typeof updates.preferredRidePartners !== "undefined")
    payload.preferredRidePartners = updates.preferredRidePartners.join(", ");
  if (typeof updates.driver !== "undefined") payload.driver = updates.driver;
  if (typeof updates.selfDriver !== "undefined") payload.selfDriver = updates.selfDriver;
  if (typeof updates.seats !== "undefined") payload.seats = updates.seats;
  if (typeof updates.carId !== "undefined") payload.carId = updates.carId;
  if (typeof updates.seatIndex !== "undefined")
    payload.seatIndex = updates.seatIndex;
  if (
    typeof updates.carId !== "undefined" &&
    updates.carId === null &&
    typeof updates.seatIndex === "undefined"
  ) {
    payload.seatIndex = null;
  }
  if (typeof updates.checkInState !== "undefined") {
    payload.checkInState = updates.checkInState;
  }

  await db
    .update(participantState)
    .set(payload)
    .where(eq(participantState.participantId, participantId));

  // If a driver is being uncancelled (from "cancelled" to something else), clear all passengers' seat assignments
  if (
    currentParticipant?.status === "cancelled" &&
    typeof updates.status !== "undefined" &&
    updates.status !== "cancelled"
  ) {
    const allParticipants = await syncFromSheet();
    const currentDriver = allParticipants.find(
      (p) => p.id === participantId && p.driver && !p.selfDriver,
    );

    if (currentDriver) {
      const carId = `car-${participantId}`;
      await db
        .update(participantState)
        .set({ carId: null, seatIndex: null, updatedAt: new Date() })
        .where(eq(participantState.carId, carId));
    }
  }

  return getEventData();
}

export async function assignRiderToCar(
  riderId: string,
  carId: string | null,
  seatIndex: number | null,
) {
  const participants = await syncFromSheet();
  const rider = participants.find((p) => p.id === riderId);

  if (!rider || rider.driver) {
    return getEventData();
  }

  if (carId === null || seatIndex === null) {
    await db
      .update(participantState)
      .set({ carId: null, seatIndex: null, updatedAt: new Date() })
      .where(eq(participantState.participantId, riderId));

    return getEventData();
  }

  const targetDriver = participants.find(
    (p) => p.driver && !p.selfDriver && `car-${p.id}` === carId,
  );
  if (!targetDriver || seatIndex < 0 || seatIndex >= targetDriver.seats) {
    return getEventData();
  }

  if (rider.carId === carId && rider.seatIndex === seatIndex) {
    return getEventData();
  }

  const occupant = participants.find(
    (p) =>
      !p.driver &&
      p.id !== riderId &&
      p.carId === carId &&
      p.seatIndex === seatIndex,
  );

  const riderPreviousCarId = rider.carId;
  const riderPreviousSeatIndex = rider.seatIndex;

  await db
    .update(participantState)
    .set({ carId, seatIndex, updatedAt: new Date() })
    .where(eq(participantState.participantId, riderId));

  if (occupant) {
    const canSwapToPreviousSeat =
      riderPreviousCarId !== null &&
      riderPreviousSeatIndex !== null &&
      riderPreviousSeatIndex >= 0;

    await db
      .update(participantState)
      .set(
        canSwapToPreviousSeat
          ? {
              carId: riderPreviousCarId,
              seatIndex: riderPreviousSeatIndex,
              updatedAt: new Date(),
            }
          : { carId: null, seatIndex: null, updatedAt: new Date() },
      )
      .where(eq(participantState.participantId, occupant.id));
  }

  return getEventData();
}

export async function autoAssignCars(prioritizeOfficers: boolean) {
  const participants = await syncFromSheet();
  const result = optimizeCarpoolAssignments(participants, prioritizeOfficers);

  const riderIds = participants
    .filter((p) => !p.driver && !p.selfDriver)
    .map((p) => p.id);

  if (riderIds.length > 0) {
    await db
      .update(participantState)
      .set({ carId: null, seatIndex: null, updatedAt: new Date() })
      .where(inArray(participantState.participantId, riderIds));
  }

  const entries = [...result.assignments.entries()];
  const nextSeatByCar = new Map<string, number>();

  for (const [riderId, assignedCarId] of entries) {
    if (assignedCarId === null) {
      continue;
    }

    const nextSeat = nextSeatByCar.get(assignedCarId) ?? 0;
    nextSeatByCar.set(assignedCarId, nextSeat + 1);

    await db
      .update(participantState)
      .set({ carId: assignedCarId, seatIndex: nextSeat, updatedAt: new Date() })
      .where(and(eq(participantState.participantId, riderId)));
  }

  const generatedCars = result.cars.map((car) => ({
    id: car.id,
    driverId: car.driverId,
    createdAt: new Date(),
  }));

  await db.delete(cars);
  if (generatedCars.length > 0) {
    await db.insert(cars).values(generatedCars);
  }

  return getEventData();
}
