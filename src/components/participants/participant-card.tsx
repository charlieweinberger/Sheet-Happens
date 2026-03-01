"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTimeline } from "@/components/participants/status-timeline";
import { ParticipantNotes } from "@/components/participants/participant-notes";
import { ParticipantRoleBadges } from "@/components/participants/participant-role-badges";
import type { EventStatus, Participant } from "@/types";

export function ParticipantCard({
  participant,
  onStatusChange,
  onSaveNotes,
}: {
  participant: Participant;
  onStatusChange: (id: string, status: EventStatus) => void;
  onSaveNotes: (id: string, notes: string) => void;
}) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>{participant.name}</CardTitle>
          <p className="text-xs text-zinc-500">{participant.email}</p>
          <p className="text-xs text-zinc-500">{participant.phone}</p>
        </div>
        <ParticipantRoleBadges participant={participant} />
      </CardHeader>
      <CardContent className="space-y-3">
        <StatusTimeline
          status={participant.status}
          onChange={(status) => onStatusChange(participant.id, status)}
        />
        {participant.preferredRidePartners &&
          participant.preferredRidePartners.length > 0 && (
            <div className="text-xs">
              <span className="font-semibold text-zinc-700">
                Prefers to ride with:{" "}
              </span>
              <span className="text-zinc-600">
                {participant.preferredRidePartners.join(", ")}
              </span>
            </div>
          )}
        <ParticipantNotes
          extraComments={participant.extraComments}
          appNotes={participant.appNotes}
          onSave={(notes) => onSaveNotes(participant.id, notes)}
        />
      </CardContent>
    </Card>
  );
}
