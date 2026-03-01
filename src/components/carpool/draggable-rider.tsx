"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { PreferredPartnersTooltip } from "@/components/shared/preferred-partners-tooltip";
import { PaidMemberIcon } from "@/components/shared/paid-member-icon";
import {
  getStatusBorderColor,
  getStatusDarkTextColor,
  getStatusLightBgColor,
} from "@/lib/statusColors";
import { cn } from "@/lib/utils";
import type { Participant } from "@/types";

interface DraggableRiderProps {
  participant: Participant;
}

export function DraggableRider({ participant }: DraggableRiderProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: participant.id,
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
      className={cn(
        "w-full rounded-md border-2 p-2 text-left text-sm flex items-center justify-between gap-2",
        getStatusBorderColor(participant.status),
        getStatusLightBgColor(participant.status),
      )}
      {...listeners}
      {...attributes}
      type="button"
    >
      <span className={cn("flex items-center gap-1", getStatusDarkTextColor(participant.status))}>
        {participant.name}
        {participant.isPaidMember && (
          <PaidMemberIcon size="small" />
        )}
        <PreferredPartnersTooltip participant={participant} />
      </span>
    </button>
  );
}
