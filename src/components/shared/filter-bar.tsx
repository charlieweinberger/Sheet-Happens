"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EventStatus } from "@/types";

export type FilterOfficer = "all" | "officer" | "not-officer";
export type FilterRole = "all" | "driver" | "self-driver" | "rider";
export type FilterStatus = "all" | EventStatus;
export type SortBy = "name" | "status";

interface FilterBarProps {
  searchTerm: string;
  filterOfficer: FilterOfficer;
  filterRole: FilterRole;
  filterStatus: FilterStatus;
  sortBy: SortBy;
  onSearchChange: (value: string) => void;
  onFilterOfficerChange: (value: FilterOfficer) => void;
  onFilterRoleChange: (value: FilterRole) => void;
  onFilterStatusChange: (value: FilterStatus) => void;
  onSortByChange: (value: SortBy) => void;
  onReset: () => void;
}

export function FilterBar({
  searchTerm,
  filterOfficer,
  filterRole,
  filterStatus,
  sortBy,
  onSearchChange,
  onFilterOfficerChange,
  onFilterRoleChange,
  onFilterStatusChange,
  onSortByChange,
  onReset,
}: FilterBarProps) {
  return (
    <div className="mb-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        <select
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm"
          value={filterOfficer}
          onChange={(e) =>
            onFilterOfficerChange(e.target.value as FilterOfficer)
          }
        >
          <option value="all">All Members</option>
          <option value="officer">Officers</option>
          <option value="not-officer">Not Officers</option>
        </select>
        <select
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm"
          value={filterRole}
          onChange={(e) => onFilterRoleChange(e.target.value as FilterRole)}
        >
          <option value="all">All Roles</option>
          <option value="driver">Drivers</option>
          <option value="self-driver">Self-Drivers</option>
          <option value="rider">Riders</option>
        </select>
        <select
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm"
          value={filterStatus}
          onChange={(e) => onFilterStatusChange(e.target.value as FilterStatus)}
        >
          <option value="all">All Statuses</option>
          <option value="awaiting">Awaiting</option>
          <option value="text_sent">Text Sent</option>
          <option value="ambiguous">Ambiguous</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="present">Present</option>
        </select>
        <select
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm"
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as SortBy)}
        >
          <option value="name">Sort: Name</option>
          <option value="status">Sort: Status</option>
        </select>
        <Button variant="outline" size="sm" onClick={onReset}>
          Reset Filters
        </Button>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
        <Input
          className="pl-8"
          placeholder="Search by name or email"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
