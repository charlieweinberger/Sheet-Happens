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

  const drivers = eligible.filter(
    (p) => p.driver && !p.selfDriver && p.seats > 0,
  );
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

  const RIDER_PREF_DRIVER_WEIGHT = 1000;
  const RIDER_PREF_PARTNER_IN_CAR_WEIGHT = 800;
  const DRIVER_PREF_RIDER_WEIGHT = 5;

  const orderedRiders = [...riders].sort((a, b) => {
    if (a.isPaidMember !== b.isPaidMember) {
      return a.isPaidMember ? -1 : 1;
    }
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

      const isFourPassengerCar = car.seatsTotal === 4;
      const wouldUseFourthSeat = car.seatsUsed + 1 > 3;

      // Keep 1 seat open in 4-passenger cars whenever another car can still take riders.
      // This effectively makes the 4th seat in a 4-passenger car a last-resort seat.
      if (isFourPassengerCar && wouldUseFourthSeat) {
        const hasAlternativeCar = cars.some((otherCar) => {
          if (otherCar.id === car.id) return false;
          if (otherCar.seatsUsed >= otherCar.seatsTotal) return false;
          if (otherCar.seatsTotal === 4 && otherCar.seatsUsed >= 3) return false;
          return true;
        });

        if (hasAlternativeCar) continue;
      }

      let score = 0;

      // PRIORITY 1: RIDER PREFERENCES (ABSOLUTE PRIORITY, EVEN IF ONE-WAY)
      // Enormous boost if driver is in rider's preferred partners list
      if (
        rider.preferredRidePartners &&
        rider.preferredRidePartners.includes(driver.name)
      ) {
        score += RIDER_PREF_DRIVER_WEIGHT;
      }

      // Massive boost if any preferred partners are already in this car
      if (
        rider.preferredRidePartners &&
        rider.preferredRidePartners.length > 0
      ) {
        const ridersInCar = car.riderIds
          .map((id) => participants.find((p) => p.id === id))
          .filter((p): p is Participant => p !== undefined);

        const preferredPartnersInCar = ridersInCar.filter((p) =>
          rider.preferredRidePartners.includes(p.name),
        ).length;

        // Enormous boost for each preferred partner in the car
        score += preferredPartnersInCar * RIDER_PREF_PARTNER_IN_CAR_WEIGHT;
      }

      // Driver->rider preference is only a small tiebreaker.
      // Rider preference should still dominate even when it's one-way.
      if (
        driver.preferredRidePartners &&
        driver.preferredRidePartners.includes(rider.name)
      ) {
        score += DRIVER_PREF_RIDER_WEIGHT;
      }

      // PRIORITY 2: LEAVE 1 SPOT OPEN (if possible)
      // Apply only to 4-passenger cars: prefer using at most 3 seats.
      if (isFourPassengerCar && wouldUseFourthSeat) {
        score -= 15.0;
      }

      // PRIORITY 3: OFFICERS IN DIFFERENT CARS
      if (prioritizeOfficers && rider.isOfficer) {
        const officerRidersInCar = car.riderIds
          .map((id) => participants.find((p) => p.id === id))
          .filter((p) => p?.isOfficer).length;
        const officerDriverInCar = driver.isOfficer;
        
        // Heavily penalize putting officers in the same car
        if (officerRidersInCar > 0 || officerDriverInCar) {
          score -= 10.0 * (officerRidersInCar + (officerDriverInCar ? 1 : 0));
        }
      }

      // Minor factor: comment similarity (very low weight)
      score += similarity(rider.extraComments, driver.extraComments) * 0.5;

      // Minor factor: spread distribution (very low weight)
      score -= car.seatsUsed * 0.2;

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
