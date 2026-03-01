import { useMemo } from "react";
import type { EventStatus, Participant } from "@/types";
import type {
  FilterOfficer,
  FilterRole,
  FilterStatus,
  SortBy,
} from "@/components/shared/filter-bar";

const statusOrder: Record<EventStatus, number> = {
  awaiting: 0,
  text_sent: 1,
  ambiguous: 2,
  confirmed: 3,
  present: 4,
  cancelled: 5,
};

export function useFilteredParticipants(
  participants: Participant[],
  searchTerm: string,
  filterOfficer: FilterOfficer,
  filterRole: FilterRole,
  filterStatus: FilterStatus,
  sortBy: SortBy,
) {
  return useMemo(() => {
    let result = participants;

    // Search filter
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter((participant) =>
        `${participant.name} ${participant.email}`.toLowerCase().includes(term),
      );
    }

    // Officer filter
    if (filterOfficer === "officer") {
      result = result.filter((p) => p.isOfficer);
    } else if (filterOfficer === "not-officer") {
      result = result.filter((p) => !p.isOfficer);
    }

    // Role filter
    if (filterRole === "driver") {
      result = result.filter((p) => p.driver && !p.selfDriver);
    } else if (filterRole === "self-driver") {
      result = result.filter((p) => p.selfDriver);
    } else if (filterRole === "rider") {
      result = result.filter((p) => !p.driver && !p.selfDriver);
    }

    // Status filter
    if (filterStatus !== "all") {
      result = result.filter((p) => p.status === filterStatus);
    }

    // Sort
    if (sortBy === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "status") {
      result = [...result].sort(
        (a, b) => statusOrder[a.status] - statusOrder[b.status],
      );
    }

    return result;
  }, [
    participants,
    searchTerm,
    filterOfficer,
    filterRole,
    filterStatus,
    sortBy,
  ]);
}
