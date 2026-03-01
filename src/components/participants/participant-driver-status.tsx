"use client";

import { useState, useImperativeHandle, forwardRef } from "react";

type DriverStatus = "rider" | "driver" | "self-driver";

interface ParticipantDriverStatusProps {
  driver: boolean;
  selfDriver: boolean;
  forceEditMode?: boolean;
}

export const ParticipantDriverStatus = forwardRef<
  { getValue: () => { driver: boolean; selfDriver: boolean } },
  ParticipantDriverStatusProps
>(({ driver, selfDriver, forceEditMode = false }, ref) => {
  const getCurrentStatus = (): DriverStatus => {
    if (selfDriver) return "self-driver";
    if (driver) return "driver";
    return "rider";
  };

  const [status, setStatus] = useState<DriverStatus>(getCurrentStatus());

  useImperativeHandle(ref, () => ({
    getValue: () => ({
      driver: status === "driver",
      selfDriver: status === "self-driver",
    }),
  }));

  const getStatusLabel = (s: DriverStatus) => {
    if (s === "self-driver") return "Self-Driver";
    if (s === "driver") return "Driver";
    return "Rider";
  };

  return (
    <>
      {!forceEditMode && (
        <div className="text-xs">
          <span className="font-semibold text-zinc-700">Status: </span>
          <span className="text-zinc-600">
            {getStatusLabel(getCurrentStatus())}
          </span>
        </div>
      )}
      {forceEditMode && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-700 whitespace-nowrap">
            Driver Status:
          </span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as DriverStatus)}
            className="text-sm border border-zinc-300 rounded px-2 py-1"
            autoFocus
          >
            <option value="rider">Rider</option>
            <option value="driver">Driver</option>
            <option value="self-driver">Self-Driver</option>
          </select>
        </div>
      )}
    </>
  );
});

ParticipantDriverStatus.displayName = "ParticipantDriverStatus";
