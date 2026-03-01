"use client";

import { Badge } from "@/components/ui/badge";
import { Seat } from "@/components/carpool/car-seat";
import { getSeatLabel, getSeatGridClass } from "@/lib/seatHelpers";
import { cn } from "@/lib/utils";
import type { Car, Participant } from "@/types";

export function CarVisualization({
  car,
  participantsById,
}: {
  car: Car;
  participantsById: Map<string, Participant>;
}) {
  const driverParticipant = participantsById.get(car.driverId);
  const occupiedCount = car.seatAssignments.filter(
    (seat) => seat !== null,
  ).length;
  const seatCount = car.seatsTotal;

  const rearSeatCount = seatCount - 1; // Total rear seats (remaining after driver)

  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-zinc-900">{car.driverName}</h3>
          <p className="text-xs text-zinc-500">
            {occupiedCount} / {seatCount} seats
          </p>
        </div>
        <Badge variant={occupiedCount >= seatCount ? "warning" : "success"}>
          {occupiedCount}/{seatCount}
        </Badge>
      </div>

      <div className="flex justify-center">
        <div className="relative w-full max-w-sm">
          {/* Car container */}
          <div className="rounded-3xl border-4 border-zinc-800 bg-zinc-100 p-4">
            {/* Front of car */}
            <div className="mb-3 h-2 rounded-full bg-zinc-700" />

            {/* Front seats */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <Seat
                seatId={`seat:${car.id}:driver`}
                seatLabel="Driver"
                occupant={driverParticipant}
                isDriver={true}
              />
              <Seat
                seatId={`seat:${car.id}:0`}
                seatLabel="Passenger"
                occupant={
                  car.seatAssignments[0]
                    ? participantsById.get(car.seatAssignments[0])
                    : undefined
                }
                isDriver={false}
              />
            </div>

            {/* Rear seats - layout depends on count */}
            <div className={cn("grid gap-3", getSeatGridClass(rearSeatCount))}>
              {Array.from({ length: rearSeatCount }).map((_, idx) => {
                const seatIndex = idx + 1;
                const riderId = car.seatAssignments[seatIndex] ?? null;
                const occupant = riderId
                  ? participantsById.get(riderId)
                  : undefined;

                return (
                  <Seat
                    key={seatIndex}
                    seatId={`seat:${car.id}:${seatIndex}`}
                    seatLabel={getSeatLabel(seatIndex, rearSeatCount)}
                    occupant={occupant}
                    isDriver={false}
                  />
                );
              })}
            </div>

            {/* Back of car */}
            <div className="mt-3 h-2 rounded-full bg-zinc-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
