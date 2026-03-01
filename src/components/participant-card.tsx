"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusTimeline } from "@/components/status-timeline";
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
  const [note, setNote] = useState(participant.appNotes);

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>{participant.name}</CardTitle>
          <p className="text-xs text-zinc-500">{participant.email}</p>
          <p className="text-xs text-zinc-500">{participant.phone}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {participant.driver ? (
            <Badge variant="info">Driver • {participant.seats} seats</Badge>
          ) : (
            <Badge>Rider</Badge>
          )}
          {participant.isOfficer && <Badge variant="success">Officer</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <StatusTimeline
          status={participant.status}
          onChange={(status) => onStatusChange(participant.id, status)}
        />
        {participant.preferredRidePartners && participant.preferredRidePartners.length > 0 && (
          <div className="text-xs">
            <span className="font-semibold text-zinc-700">Prefers to ride with: </span>
            <span className="text-zinc-600">{participant.preferredRidePartners.join(", ")}</span>
          </div>
        )}
        <div className="text-xs text-zinc-500">
          Preferences: {participant.riderPreferences || "None"}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Internal notes"
          />
          <Button variant="secondary" size="sm" onClick={() => onSaveNotes(participant.id, note)}>
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
