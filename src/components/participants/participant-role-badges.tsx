import { Badge } from "@/components/ui/badge";
import type { Participant } from "@/types";

interface ParticipantRoleBadgesProps {
  participant: Participant;
}

export function ParticipantRoleBadges({
  participant,
}: ParticipantRoleBadgesProps) {
  return (
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
  );
}
