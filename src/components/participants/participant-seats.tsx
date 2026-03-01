"use client";

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ParticipantSeatsProps {
  seats: number;
  needsReview?: boolean;
  forceEditMode?: boolean;
}

export const ParticipantSeats = forwardRef<
  { getValue: () => number },
  ParticipantSeatsProps
>(({ seats, needsReview = false, forceEditMode = false }, ref) => {
  const [seatsValue, setSeatsValue] = useState(seats.toString());

  // Sync state when props change
  useEffect(() => {
    setSeatsValue(seats.toString());
  }, [seats]);

  useImperativeHandle(ref, () => ({
    getValue: () => {
      const parsed = parseInt(seatsValue, 10);
      return !isNaN(parsed) && parsed >= 0 ? parsed : seats;
    },
  }));

  return (
    <>
      {!forceEditMode && (
        <div className="text-xs flex items-center gap-2">
          <span className="font-semibold text-zinc-700">Car Seats: </span>
          <span className="text-zinc-600">{seats}</span>
          {needsReview && (
            <Badge variant="warning" className="text-[10px] py-0 px-1.5">
              Needs Review
            </Badge>
          )}
        </div>
      )}
      {forceEditMode && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-700 whitespace-nowrap">
            Car Seats:
          </span>
          <Input
            type="number"
            min="0"
            value={seatsValue}
            onChange={(e) => setSeatsValue(e.target.value)}
            placeholder="Number of seats"
            autoFocus
            className="w-24"
          />
          {needsReview && (
            <Badge variant="warning" className="text-[10px] py-0 px-1.5">
              Needs Review
            </Badge>
          )}
        </div>
      )}
    </>
  );
});

ParticipantSeats.displayName = "ParticipantSeats";
