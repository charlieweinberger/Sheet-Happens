"use client";

import { ParticipantCard } from "@/components/participants/participant-card";
import { getStatusCardClass } from "@/lib/statusColors";
import type { EventStatus, Participant } from "@/types";

interface ParticipantListProps {
  participants: Participant[];
  onStatusChange: (id: string, status: EventStatus) => void;
  onSaveNotes: (id: string, notes: string) => void;
  onSavePreferences: (id: string, partners: string[]) => void;
  onSaveSeats: (id: string, seats: number) => void;
  onSaveDriverStatus: (id: string, driver: boolean, selfDriver: boolean) => void;
}

export function ParticipantList({
  participants,
  onStatusChange,
  onSaveNotes,
  onSavePreferences,
  onSaveSeats,
  onSaveDriverStatus,
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
            onSavePreferences={onSavePreferences}
            onSaveSeats={onSaveSeats}
            onSaveDriverStatus={onSaveDriverStatus}
          />
        </div>
      ))}
    </div>
  );
}
