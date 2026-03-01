"use client";

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Input } from "@/components/ui/input";

interface ParticipantPreferencesProps {
  preferredRidePartners: string[];
  forceEditMode?: boolean;
}

export const ParticipantPreferences = forwardRef<
  { getValue: () => string[] },
  ParticipantPreferencesProps
>(({ preferredRidePartners, forceEditMode = false }, ref) => {
  const [partnersText, setPartnersText] = useState(
    preferredRidePartners.join(", ")
  );

  // Sync state when props change
  useEffect(() => {
    setPartnersText(preferredRidePartners.join(", "));
  }, [preferredRidePartners]);

  useImperativeHandle(ref, () => ({
    getValue: () => {
      return partnersText
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
    },
  }));

  return (
    <>
      {!forceEditMode && (
        <div className="text-xs">
          <span className="font-semibold text-zinc-700">
            Prefers to ride with:{" "}
          </span>
          <span className="text-zinc-600">
            {preferredRidePartners.length > 0
              ? preferredRidePartners.join(", ")
              : "None specified"}
          </span>
        </div>
      )}
      {forceEditMode && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-700 whitespace-nowrap">
            Prefers to ride with:
          </span>
          <Input
            value={partnersText}
            onChange={(e) => setPartnersText(e.target.value)}
            placeholder="Enter names separated by commas"
            autoFocus
          />
        </div>
      )}
    </>
  );
});

ParticipantPreferences.displayName = "ParticipantPreferences";
