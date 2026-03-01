"use client";

import { OfficerIcon } from "@/components/shared/officer-icon";
import { Badge } from "@/components/ui/badge";
import { getStatusSelectClass } from "@/lib/statusColors";
import { getParticipantRoleLabel } from "@/lib/participantHelpers";
import type { EventStatus, Participant } from "@/types";

interface ParticipantTableProps {
  participants: Participant[];
  onStatusChange: (id: string, payload: Partial<Participant>) => void;
}

export function ParticipantTable({
  participants,
  onStatusChange,
}: ParticipantTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="px-3 py-2 text-left font-semibold text-zinc-900">
              Name
            </th>
            <th className="px-3 py-2 text-left font-semibold text-zinc-900">
              Role
            </th>
            <th className="px-3 py-2 text-left font-semibold text-zinc-900">
              Preferred Partners
            </th>
            <th className="px-3 py-2 text-left font-semibold text-zinc-900">
              Status
            </th>
            <th className="px-3 py-2 text-left font-semibold text-zinc-900">
              Review
            </th>
          </tr>
        </thead>
        <tbody>
          {participants.map((participant) => (
            <tr
              key={participant.id}
              className="border-b border-zinc-100 hover:bg-zinc-50"
            >
              <td className="px-3 py-2 text-zinc-900">
                <div className="flex items-center gap-2">
                  {participant.name}
                  {participant.isOfficer && <OfficerIcon className="h-4 w-4" />}
                </div>
              </td>
              <td className="px-3 py-2 text-zinc-600 text-xs">
                {getParticipantRoleLabel(participant)}
              </td>
              <td className="px-3 py-2 text-zinc-600 text-xs">
                {participant.preferredRidePartners?.length
                  ? participant.preferredRidePartners.join(", ")
                  : "-"}
              </td>
              <td className="px-3 py-2">
                <select
                  className={getStatusSelectClass(participant.status)}
                  value={`${participant.status}|${participant.checkInState}`}
                  onChange={(e) => {
                    const [status, checkInState] = e.target.value.split("|");
                    const updatedPayload: {
                      status: EventStatus;
                      checkInState: Participant["checkInState"];
                      carId?: null;
                      seatIndex?: null;
                    } = {
                      status: status as EventStatus,
                      checkInState:
                        checkInState === "null"
                          ? null
                          : (checkInState as Participant["checkInState"]),
                    };

                    // Clear carpool assignment when cancelled
                    if (status === "cancelled") {
                      updatedPayload.carId = null;
                      updatedPayload.seatIndex = null;
                    }

                    onStatusChange(participant.id, updatedPayload);
                  }}
                >
                  <optgroup label="Signed Up">
                    <option value="awaiting|null">Signed Up</option>
                  </optgroup>
                  <optgroup label="Text Sent">
                    <option value="text_sent|null">Text Sent</option>
                  </optgroup>
                  <optgroup label="Response">
                    <option value="confirmed|null">Confirmed</option>
                    <option value="ambiguous|null">Ambiguous Response</option>
                    <option value="cancelled|null">Cancelled</option>
                  </optgroup>
                  <optgroup label="Present">
                    <option value="present|null">Present</option>
                  </optgroup>
                </select>
              </td>
              <td className="px-3 py-2">
                <div className="flex flex-col gap-1">
                  {participant.needsManualReviewDriverCapacity && (
                    <Badge variant="warning" className="text-[10px] py-0 px-1.5 w-fit">
                      Capacity
                    </Badge>
                  )}
                  {participant.needsManualReviewNotes && (
                    <Badge variant="warning" className="text-[10px] py-0 px-1.5 w-fit">
                      Notes
                    </Badge>
                  )}
                  {!participant.needsManualReviewDriverCapacity && 
                   !participant.needsManualReviewNotes && (
                    <span className="text-zinc-400 text-xs">-</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
