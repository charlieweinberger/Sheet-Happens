"use client";

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Input } from "@/components/ui/input";

interface ParticipantNotesProps {
  extraComments?: string;
  appNotes: string;
  forceEditMode?: boolean;
}

export const ParticipantNotes = forwardRef<
  { getValue: () => string },
  ParticipantNotesProps
>(({ extraComments, appNotes, forceEditMode = false }, ref) => {
  const [note, setNote] = useState(appNotes);

  // Sync state when props change
  useEffect(() => {
    setNote(appNotes);
  }, [appNotes]);

  useImperativeHandle(ref, () => ({
    getValue: () => note.trim(),
  }));

  return (
    <>
      {extraComments && (
        <div className="text-xs">
          <span className="font-semibold text-zinc-700">Extra Comments: </span>
          <span className="text-zinc-600">{extraComments}</span>
        </div>
      )}
      {!forceEditMode && (
        <div className="text-xs">
          <span className="font-semibold text-zinc-700">Officer Note: </span>
          <span className="text-zinc-600">
            {appNotes || "None"}
          </span>
        </div>
      )}
      {forceEditMode && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-700 whitespace-nowrap">
            Officer Note:
          </span>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add officer note"
            autoFocus
          />
        </div>
      )}
    </>
  );
});

ParticipantNotes.displayName = "ParticipantNotes";
