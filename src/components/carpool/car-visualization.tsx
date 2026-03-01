"use client";

import { Badge } from "@/components/ui/badge";
import { Seat } from "@/components/carpool/car-seat";
import { getSeatLabel } from "@/lib/seatHelpers";
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
            <div className="flex flex-col gap-3">
              {rearSeatCount === 3 && (
                <div className="flex gap-3">
                  {Array.from({ length: 3 }).map((_, idx) => {
                    const seatIndex = idx + 1;
                    const riderId = car.seatAssignments[seatIndex] ?? null;
                    const occupant = riderId ? participantsById.get(riderId) : undefined;
                    return (
                      <div key={seatIndex} className="flex-1">
                        <Seat
                          seatId={`seat:${car.id}:${seatIndex}`}
                          seatLabel={getSeatLabel(seatIndex, rearSeatCount)}
                          occupant={occupant}
                          isDriver={false}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              {rearSeatCount === 4 && (
                <>
                  <div className="flex gap-3">
                    {[1, 2].map((seatIndex) => {
                      const riderId = car.seatAssignments[seatIndex] ?? null;
                      const occupant = riderId ? participantsById.get(riderId) : undefined;
                      return (
                        <div key={seatIndex} className="flex-1">
                          <Seat
                            seatId={`seat:${car.id}:${seatIndex}`}
                            seatLabel={getSeatLabel(seatIndex, rearSeatCount)}
                            occupant={occupant}
                            isDriver={false}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-3">
                    {[3, 4].map((seatIndex) => {
                      const riderId = car.seatAssignments[seatIndex] ?? null;
                      const occupant = riderId ? participantsById.get(riderId) : undefined;
                      return (
                        <div key={seatIndex} className="flex-1">
                          <Seat
                            seatId={`seat:${car.id}:${seatIndex}`}
                            seatLabel={getSeatLabel(seatIndex, rearSeatCount)}
                            occupant={occupant}
                            isDriver={false}
                          />
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {rearSeatCount === 5 && (
                <>
                  <div className="flex gap-3">
                    {[1, 2, 3].map((seatIndex) => {
                      const riderId = car.seatAssignments[seatIndex] ?? null;
                      const occupant = riderId ? participantsById.get(riderId) : undefined;
                      return (
                        <div key={seatIndex} className="flex-1">
                          <Seat
                            seatId={`seat:${car.id}:${seatIndex}`}
                            seatLabel={getSeatLabel(seatIndex, rearSeatCount)}
                            occupant={occupant}
                            isDriver={false}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 justify-center">
                    {[4, 5].map((seatIndex) => {
                      const riderId = car.seatAssignments[seatIndex] ?? null;
                      const occupant = riderId ? participantsById.get(riderId) : undefined;
                      return (
                        <div key={seatIndex} className="flex-1 max-w-[calc(50%-0.375rem)]">
                          <Seat
                            seatId={`seat:${car.id}:${seatIndex}`}
                            seatLabel={getSeatLabel(seatIndex, rearSeatCount)}
                            occupant={occupant}
                            isDriver={false}
                          />
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {(rearSeatCount < 3 || rearSeatCount > 5) && (
                Array.from({ length: Math.ceil(rearSeatCount / 3) }).map((_, rowIdx) => (
                  <div key={rowIdx} className="flex gap-3">
                    {Array.from({ length: Math.min(3, rearSeatCount - rowIdx * 3) }).map((_, colIdx) => {
                      const seatIndex = rowIdx * 3 + colIdx + 1;
                      const riderId = car.seatAssignments[seatIndex] ?? null;
                      const occupant = riderId ? participantsById.get(riderId) : undefined;
                      return (
                        <div key={seatIndex} className="flex-1">
                          <Seat
                            seatId={`seat:${car.id}:${seatIndex}`}
                            seatLabel={getSeatLabel(seatIndex, rearSeatCount)}
                            occupant={occupant}
                            isDriver={false}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Back of car */}
            <div className="mt-3 h-2 rounded-full bg-zinc-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
