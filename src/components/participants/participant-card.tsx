"use client";

import { useState, useRef } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTimeline } from "@/components/participants/status-timeline";
import { ParticipantNotes } from "@/components/participants/participant-notes";
import { ParticipantPreferences } from "@/components/participants/participant-preferences";
import { ParticipantSeats } from "@/components/participants/participant-seats";
import { ParticipantDriverStatus } from "@/components/participants/participant-driver-status";
import { ParticipantRoleBadges } from "@/components/participants/participant-role-badges";
import type { EventStatus, Participant } from "@/types";

export function ParticipantCard({
  participant,
  onStatusChange,
  onSaveNotes,
  onSavePreferences,
  onSaveSeats,
  onSaveDriverStatus,
}: {
  participant: Participant;
  onStatusChange: (id: string, status: EventStatus) => void;
  onSaveNotes: (id: string, notes: string) => void;
  onSavePreferences: (id: string, partners: string[]) => void;
  onSaveSeats: (id: string, seats: number) => void;
  onSaveDriverStatus: (id: string, driver: boolean, selfDriver: boolean) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const driverStatusRef = useRef<{ getValue: () => { driver: boolean; selfDriver: boolean } }>(null);
  const seatsRef = useRef<{ getValue: () => number }>(null);
  const preferencesRef = useRef<{ getValue: () => string[] }>(null);
  const notesRef = useRef<{ getValue: () => string }>(null);

  const handleCancel = () => {
    setIsEditing(false);
    // Reset all fields by re-rendering
    window.location.reload();
  };

  const handleSave = () => {
    // Call all the save handlers with current values from refs
    if (driverStatusRef.current) {
      const { driver, selfDriver } = driverStatusRef.current.getValue();
      onSaveDriverStatus(participant.id, driver, selfDriver);
    }
    if (seatsRef.current && participant.driver && !participant.selfDriver) {
      const seats = seatsRef.current.getValue();
      onSaveSeats(participant.id, seats);
    }
    if (preferencesRef.current) {
      const partners = preferencesRef.current.getValue();
      onSavePreferences(participant.id, partners);
    }
    if (notesRef.current) {
      const notes = notesRef.current.getValue();
      onSaveNotes(participant.id, notes);
    }
    setIsEditing(false);
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>{participant.name}</CardTitle>
          <p className="text-xs text-zinc-500">{participant.email}</p>
          <p className="text-xs text-zinc-500">{participant.phone}</p>
        </div>
        <div className="flex items-center gap-2">
          <ParticipantRoleBadges participant={participant} />
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-full p-2 hover:bg-zinc-100 transition-colors"
              aria-label="Edit participant"
            >
              <Pencil className="h-4 w-4 text-zinc-500" />
            </button>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={handleSave}>
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <StatusTimeline
          status={participant.status}
          onChange={(status) => onStatusChange(participant.id, status)}
        />
        <ParticipantDriverStatus
          ref={driverStatusRef}
          driver={participant.driver}
          selfDriver={participant.selfDriver}
          forceEditMode={isEditing}
        />
        {participant.driver && !participant.selfDriver && (
          <ParticipantSeats
            ref={seatsRef}
            seats={participant.seats}
            needsReview={participant.needsManualReviewDriverCapacity}
            forceEditMode={isEditing}
          />
        )}
        <ParticipantPreferences
          ref={preferencesRef}
          preferredRidePartners={participant.preferredRidePartners || []}
          forceEditMode={isEditing}
        />
        <ParticipantNotes
          ref={notesRef}
          extraComments={participant.extraComments}
          appNotes={participant.appNotes}
          needsReview={participant.needsManualReviewNotes}
          forceEditMode={isEditing}
        />
      </CardContent>
    </Card>
  );
}
