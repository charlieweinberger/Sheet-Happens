import type { Participant } from "@/types";

export function getParticipantRoleLabel(participant: Participant): string {
  if (participant.selfDriver) {
    return "Self-Driver";
  }
  if (participant.driver) {
    const seats = participant.seats;
    return `Driver (${seats} seat${seats > 1 ? "s" : ""})`;
  }
  return "Rider";
}

export function getParticipantsByRole(participants: Participant[]) {
  const riders = participants.filter(
    (p) => !p.driver && !p.selfDriver && p.status !== "cancelled",
  );
  const selfDrivers = participants.filter(
    (p) => p.selfDriver && p.status !== "cancelled",
  );
  const drivers = participants.filter((p) => p.driver && !p.selfDriver);

  return { riders, selfDrivers, drivers };
}

export function getUnassignedRiders(
  riders: Participant[],
  driversById: Map<string, Participant>,
): Participant[] {
  return riders.filter((r) => {
    if (!r.carId) return true;
    const driverId = r.carId.replace("car-", "");
    const driver = driversById.get(driverId);
    return !driver || driver.status === "cancelled";
  });
}
