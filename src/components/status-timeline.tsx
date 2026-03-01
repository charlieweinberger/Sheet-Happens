"use client";

import type { EventStatus } from "@/types";
import { cn } from "@/lib/utils";
import { getStatusButtonClass } from "@/lib/statusColors";

export function StatusTimeline({
  status,
  onChange,
}: {
  status: EventStatus;
  onChange: (next: EventStatus) => void;
}) {
  // Response options: mutually exclusive
  const responseOptions = [
    { value: "confirmed" as const, label: "Confirmed" },
    { value: "ambiguous" as const, label: "Ambiguous" },
    { value: "cancelled" as const, label: "Cancelled" },
  ];

  return (
    <div className="space-y-2">
      {/* Main flow: Progression → Response → Present */}
      <div className="flex items-center justify-between gap-2 text-xs">
        {/* Signed Up / Text Sent toggle */}
        <div className="flex gap-1 flex-1">
          <button
            type="button"
            onClick={() => onChange("awaiting")}
            className={cn(
              "flex-1 rounded px-2 py-2 font-semibold transition-colors",
              getStatusButtonClass("awaiting", status === "awaiting"),
            )}
          >
            Signed Up
          </button>
          <button
            type="button"
            onClick={() => onChange("text_sent")}
            className={cn(
              "flex-1 rounded px-2 py-2 font-semibold transition-colors",
              getStatusButtonClass("text_sent", status === "text_sent"),
            )}
          >
            Text Sent
          </button>
        </div>

        {/* Arrow separator */}
        <div className="text-zinc-400">→</div>

        {/* Response options: Ambiguous / Confirmed / Cancelled */}
        <div className="flex gap-1 flex-1">
          {responseOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "flex-1 rounded px-2 py-2 font-semibold transition-colors",
                getStatusButtonClass(option.value, status === option.value),
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Arrow + Present */}
        <div className="text-zinc-400">→</div>
        <button
          type="button"
          onClick={() => status !== "cancelled" && onChange("present")}
          disabled={status === "cancelled"}
          className={cn(
            "rounded px-2 py-2 font-semibold transition-colors whitespace-nowrap",
            status === "cancelled"
              ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
              : getStatusButtonClass("present", status === "present"),
          )}
        >
          Present
        </button>
      </div>
    </div>
  );
}
