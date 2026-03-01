"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusTimeline } from "@/components/status-timeline";
import { Pencil } from "lucide-react";
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
  const [showNoteInput, setShowNoteInput] = useState(false);

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>{participant.name}</CardTitle>
          <p className="text-xs text-zinc-500">{participant.email}</p>
          <p className="text-xs text-zinc-500">{participant.phone}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {participant.selfDriver ? (
            <Badge variant="info">Self-Driver</Badge>
          ) : participant.driver ? (
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
        <div className="flex items-start justify-between gap-2">
          <div className="text-xs text-zinc-500">
            <div className="font-semibold text-zinc-700">Extra Comments:</div>
            {participant.extraComments ? (
              <div className="mt-1 text-zinc-600">{participant.extraComments}</div>
            ) : (
              <div className="mt-1">None</div>
            )}
            {participant.appNotes && (
              <div className="mt-1 text-zinc-600">
                {participant.appNotes} <span className="italic text-zinc-400">(Added by officer)</span>
              </div>
            )}
          </div>
          {!showNoteInput && (
            <button
              onClick={() => {
                setNote(participant.appNotes);
                setShowNoteInput(true);
              }}
              className="rounded-full p-1 hover:bg-zinc-100 transition-colors"
              aria-label="Edit officer note"
            >
              <Pencil className="h-4 w-4 text-zinc-500" />
            </button>
          )}
        </div>
        {showNoteInput && (
          <div className="flex items-center gap-2">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add officer note"
              autoFocus
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onSaveNotes(participant.id, note.trim());
                setShowNoteInput(false);
              }}
            >
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setNote(participant.appNotes);
                setShowNoteInput(false);
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
