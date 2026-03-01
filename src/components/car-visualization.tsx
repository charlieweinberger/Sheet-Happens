"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { PreferredPartnersTooltip } from "@/components/preferred-partners-tooltip";
import { getStatusBorderColor, getStatusLightBgColor, getStatusDarkTextColor } from "@/lib/statusColors";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import type { Car, Participant } from "@/types";

interface SeatProps {
  seatId: string;
  seatLabel: string;
  occupant: Participant | undefined;
  isDriver: boolean;
}

function DraggableOccupant({ occupant }: { occupant: Participant }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: occupant.id,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      className={cn(
        "relative flex w-full h-full touch-none flex-col items-center justify-center rounded-md px-1 py-1",
        getStatusBorderColor(occupant.status),
        getStatusLightBgColor(occupant.status),
      )}
      title={occupant.name}
      {...listeners}
      {...attributes}
    >
      <span className={cn("text-center text-xs font-bold flex items-center gap-1", getStatusDarkTextColor(occupant.status))}>
        {occupant.name}
        {occupant.isOfficer && <User className="h-3 w-3" />}
        <PreferredPartnersTooltip participant={occupant} />
      </span>
    </button>
  );
}

function Seat({ seatId, seatLabel, occupant, isDriver }: SeatProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: seatId,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex h-20 flex-col items-center justify-center rounded-lg border-2 font-semibold transition-all",
        !occupant && (isDriver ? "border-amber-400 bg-amber-50" : "border-zinc-300 bg-white"),
        isOver &&
          "border-zinc-900 bg-zinc-100 shadow-md ring-2 ring-zinc-500 ring-offset-1",
        occupant && getStatusBorderColor(occupant.status),
        occupant && getStatusLightBgColor(occupant.status),
      )}
      title={occupant ? occupant.name : seatLabel}
    >
      {occupant ? (
        isDriver ? (
          <>
            <span className={cn("text-xs font-bold flex items-center justify-center gap-1", getStatusDarkTextColor(occupant.status))}>
              {occupant.name}
              {occupant.isOfficer && <User className="h-3 w-3" />}
              <PreferredPartnersTooltip participant={occupant} />
            </span>
            <span className={cn("text-center text-[10px]", getStatusDarkTextColor(occupant.status))}>
              Driver
            </span>
          </>
        ) : (
          <DraggableOccupant occupant={occupant} />
        )
      ) : (
        <span className="text-center text-xs text-zinc-500">{seatLabel}</span>
      )}
    </div>
  );
}

export function CarVisualization({
  car,
  participantsById,
}: {
  car: Car;
  participantsById: Map<string, Participant>;
}) {
  const driverParticipant = participantsById.get(car.driverId);
  const occupiedCount = car.seatAssignments.filter((seat) => seat !== null).length;
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
                occupant={car.seatAssignments[0] ? participantsById.get(car.seatAssignments[0]) : undefined}
                isDriver={false}
              />
            </div>

            {/* Rear seats - layout depends on count */}
            <div
              className={cn(
                "grid gap-3",
                rearSeatCount === 1
                  ? "grid-cols-1"
                  : rearSeatCount === 2
                    ? "grid-cols-2"
                    : "grid-cols-3",
              )}
            >
              {Array.from({ length: rearSeatCount }).map((_, idx) => {
                const seatIndex = idx + 1;
                const riderId = car.seatAssignments[seatIndex] ?? null;
                const occupant = riderId ? participantsById.get(riderId) : undefined;

                return (
                  <Seat
                    key={seatIndex}
                    seatId={`seat:${car.id}:${seatIndex}`}
                    seatLabel={
                      rearSeatCount === 1
                        ? "Rear"
                        : rearSeatCount === 2
                          ? idx === 0
                            ? "Rear L"
                            : "Rear R"
                          : idx === 0
                            ? "Rear L"
                            : idx === 1
                              ? "Rear C"
                              : "Rear R"
                    }
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
