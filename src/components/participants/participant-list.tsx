"use client";

import { ParticipantCard } from "@/components/participants/participant-card";
import { getStatusCardClass } from "@/lib/statusColors";
import type { EventStatus, Participant } from "@/types";

interface ParticipantListProps {
  participants: Participant[];
  onStatusChange: (id: string, status: EventStatus) => void;
  onSaveNotes: (id: string, notes: string) => void;
}

export function ParticipantList({
  participants,
  onStatusChange,
  onSaveNotes,
}: ParticipantListProps) {
  return (
    <div className="grid gap-3">
      {participants.map((participant) => (
        <div
          key={participant.id}
          className={getStatusCardClass(participant.status)}
        >
          <ParticipantCard
            participant={participant}
            onStatusChange={onStatusChange}
            onSaveNotes={onSaveNotes}
          />
        </div>
      ))}
    </div>
  );
}
