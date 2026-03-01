import { Info } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import type { Participant } from "@/types";

export function PreferredPartnersTooltip({ participant }: { participant: Participant }) {
  const hasPreferences = participant.preferredRidePartners && participant.preferredRidePartners.length > 0;

  if (!hasPreferences) {
    return null;
  }

  return (
    <Tooltip
      content={
        <div>
          <div className="font-semibold mb-1">Prefers to ride with:</div>
          {participant.preferredRidePartners.join(", ")}
        </div>
      }
    >
      <Info className="h-3 w-3 text-zinc-500 shrink-0" />
    </Tooltip>
  );
}
