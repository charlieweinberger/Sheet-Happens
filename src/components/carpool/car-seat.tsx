"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { PreferredPartnersTooltip } from "@/components/shared/preferred-partners-tooltip";
import { OfficerIcon } from "@/components/shared/officer-icon";
import { PaidMemberIcon } from "@/components/shared/paid-member-icon";
import {
  getStatusBorderColor,
  getStatusLightBgColor,
  getStatusDarkTextColor,
} from "@/lib/statusColors";
import { cn } from "@/lib/utils";
import type { Participant } from "@/types";

interface DraggableOccupantProps {
  occupant: Participant;
}

export function DraggableOccupant({ occupant }: DraggableOccupantProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: occupant.id,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
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
      <span
        className={cn(
          "text-center text-xs font-bold flex items-center gap-1",
          getStatusDarkTextColor(occupant.status),
        )}
      >
        {occupant.name}
        {occupant.isPaidMember && (
          <PaidMemberIcon size="small" />
        )}
        {occupant.isOfficer && <OfficerIcon className="h-3 w-3" />}
        <PreferredPartnersTooltip participant={occupant} />
      </span>
    </button>
  );
}

interface SeatProps {
  seatId: string;
  seatLabel: string;
  occupant: Participant | undefined;
  isDriver: boolean;
}

export function Seat({ seatId, seatLabel, occupant, isDriver }: SeatProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: seatId,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex h-20 flex-col items-center justify-center rounded-lg border-2 font-semibold transition-all",
        !occupant &&
          (isDriver
            ? "border-amber-400 bg-amber-50"
            : "border-zinc-300 bg-white"),
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
            <span
              className={cn(
                "text-xs font-bold flex items-center justify-center gap-1",
                getStatusDarkTextColor(occupant.status),
              )}
            >
              {occupant.name}
              {occupant.isPaidMember && (
                <PaidMemberIcon size="small" />
              )}
              {occupant.isOfficer && <OfficerIcon className="h-3 w-3" />}
              <PreferredPartnersTooltip participant={occupant} />
            </span>
            <span
              className={cn(
                "text-center text-[10px]",
                getStatusDarkTextColor(occupant.status),
              )}
            >
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
