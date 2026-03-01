"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ParticipantNotesProps {
  extraComments?: string;
  appNotes: string;
  onSave: (notes: string) => void;
}

export function ParticipantNotes({
  extraComments,
  appNotes,
  onSave,
}: ParticipantNotesProps) {
  const [note, setNote] = useState(appNotes);
  const [showNoteInput, setShowNoteInput] = useState(false);

  const handleSave = () => {
    onSave(note.trim());
    setShowNoteInput(false);
  };

  const handleCancel = () => {
    setNote(appNotes);
    setShowNoteInput(false);
  };

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs text-zinc-500">
          <div className="font-semibold text-zinc-700">Extra Comments:</div>
          {extraComments ? (
            <div className="mt-1 text-zinc-600">{extraComments}</div>
          ) : (
            <div className="mt-1">None</div>
          )}
          {appNotes && (
            <div className="mt-1 text-zinc-600">
              {appNotes}{" "}
              <span className="italic text-zinc-400">(Added by officer)</span>
            </div>
          )}
        </div>
        {!showNoteInput && (
          <button
            onClick={() => {
              setNote(appNotes);
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
          <Button variant="secondary" size="sm" onClick={handleSave}>
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      )}
    </>
  );
}
