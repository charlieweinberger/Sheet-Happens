import type { Car, Participant } from "@/types";

function tokenize(input: string) {
  return new Set(
    input
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter(Boolean),
  );
}

function similarity(a: string, b: string) {
  const aSet = tokenize(a);
  const bSet = tokenize(b);
  if (aSet.size === 0 && bSet.size === 0) return 0;

  let overlap = 0;
  for (const token of aSet) {
    if (bSet.has(token)) overlap += 1;
  }

  const unionSize = new Set([...aSet, ...bSet]).size;
  return unionSize === 0 ? 0 : overlap / unionSize;
}

export function optimizeCarpoolAssignments(
  participants: Participant[],
  prioritizeOfficers = true,
) {
  const eligible = participants.filter((p) => p.status !== "cancelled");

  const drivers = eligible.filter((p) => p.driver && !p.selfDriver && p.seats > 0);
  const riders = eligible.filter((p) => !p.driver && !p.selfDriver);

  const cars: Car[] = drivers.map((driver) => ({
    id: `car-${driver.id}`,
    driverId: driver.id,
    driverName: driver.name,
    seatsTotal: driver.seats,
    seatsUsed: 0,
    riderIds: [],
    seatAssignments: Array.from({ length: driver.seats }, () => null),
  }));

  if (cars.length === 0) {
    return {
      cars: [],
      assignments: new Map<string, string | null>(),
    };
  }

  const assignments = new Map<string, string | null>();

  const orderedRiders = [...riders].sort((a, b) => {
    if (prioritizeOfficers && a.isOfficer !== b.isOfficer) {
      return a.isOfficer ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  for (const rider of orderedRiders) {
    let bestCar: Car | null = null;
    let bestScore = -Infinity;

    for (const car of cars) {
      if (car.seatsUsed >= car.seatsTotal) continue;

      const driver = drivers.find((d) => d.id === car.driverId);
      if (!driver) continue;

      let score = similarity(rider.extraComments, driver.extraComments);

      // Boost score if driver is in rider's preferred partners list
      if (rider.preferredRidePartners && rider.preferredRidePartners.includes(driver.name)) {
        score += 5.0;
      }

      // Boost score if any preferred partners are already in this car
      if (rider.preferredRidePartners && rider.preferredRidePartners.length > 0) {
        const ridersInCar = car.riderIds
          .map((id) => participants.find((p) => p.id === id))
          .filter((p): p is Participant => p !== undefined);
        
        const preferredPartnersInCar = ridersInCar.filter((p) =>
          rider.preferredRidePartners.includes(p.name)
        ).length;

        // Give significant boost for each preferred partner in the car
        score += preferredPartnersInCar * 3.0;
      }

      // Also check if the driver prefers this rider
      if (driver.preferredRidePartners && driver.preferredRidePartners.includes(rider.name)) {
        score += 2.0;
      }

      if (prioritizeOfficers && rider.isOfficer) {
        const officerRidersInCar = car.riderIds
          .map((id) => participants.find((p) => p.id === id))
          .filter((p) => p?.isOfficer).length;
        score += officerRidersInCar > 0 ? 1.5 : 0.5;
      }

      // Spread mode: prefer cars with fewer riders to distribute evenly
      // Give negative score for each rider already in car to spread out
      score -= car.seatsUsed * 3.0;

      if (score > bestScore) {
        bestScore = score;
        bestCar = car;
      }
    }

    if (!bestCar) {
      assignments.set(rider.id, null);
      continue;
    }

    bestCar.riderIds.push(rider.id);
    bestCar.seatsUsed += 1;
    assignments.set(rider.id, bestCar.id);
  }

  return { cars, assignments };
}
