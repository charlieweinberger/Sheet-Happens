"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { DashboardSummary } from "@/components/dashboard/dashboard-summary";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { ParticipantList } from "@/components/participants/participant-list";
import { ParticipantTable } from "@/components/participants/participant-table";
import { CarVisualization } from "@/components/carpool/car-visualization";
import { DraggableRider } from "@/components/carpool/draggable-rider";
import { UnassignedLane } from "@/components/carpool/unassigned-lane";
import { SelfDriversLane } from "@/components/carpool/self-drivers-lane";
import {
  FilterBar,
  type FilterOfficer,
  type FilterRole,
  type FilterStatus,
  type SortBy,
} from "@/components/shared/filter-bar";
import { useFilteredParticipants } from "@/hooks/useFilteredParticipants";
import { fetchJson } from "@/lib/apiClient";
import {
  getParticipantsByRole,
  getUnassignedRiders,
} from "@/lib/participantHelpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Car, EventData } from "@/types";

export function OperationsStudio({ 
  initialData, 
  sheetName 
}: { 
  initialData: EventData;
  sheetName: string;
}) {
  const [data, setData] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOfficer, setFilterOfficer] = useState<FilterOfficer>("all");
  const [filterRole, setFilterRole] = useState<FilterRole>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [viewMode, setViewMode] = useState<"list" | "table">("list");
  const [isPending, startTransition] = useTransition();

  const participantsById = useMemo(
    () => new Map(data.participants.map((p) => [p.id, p])),
    [data.participants],
  );

  const filteredParticipants = useFilteredParticipants(
    data.participants,
    searchTerm,
    filterOfficer,
    filterRole,
    filterStatus,
    sortBy,
  );

  const { riders, selfDrivers, drivers } = useMemo(
    () => getParticipantsByRole(data.participants),
    [data.participants],
  );

  const driversById = useMemo(
    () => new Map(drivers.map((d) => [d.id, d])),
    [drivers],
  );

  const unassigned = useMemo(
    () => getUnassignedRiders(riders, driversById),
    [riders, driversById],
  );

  function mutate(path: string, init: RequestInit) {
    startTransition(async () => {
      const next = await fetchJson(path, init);
      setData(next);
    });
  }

  function updateParticipant(participantId: string, payload: object) {
    mutate(`/api/participants/${participantId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterOfficer("all");
    setFilterRole("all");
    setFilterStatus("all");
  };

  function onDragEnd(event: DragEndEvent) {
    const riderId = String(event.active.id);
    const target = event.over?.id ? String(event.over.id) : null;

    if (!target) return;

    const activeParticipant = participantsById.get(riderId);
    if (!activeParticipant || activeParticipant.driver) return;

    let carId: string | null | undefined;
    let seatIndex: number | null | undefined;

    if (target === "unassigned") {
      carId = null;
      seatIndex = null;
    } else if (target.startsWith("seat:")) {
      const parts = target.split(":");
      carId = parts[1];
      const seatPart = parts[2];
      const parsedSeat = Number.parseInt(seatPart, 10);
      if (Number.isNaN(parsedSeat)) return;
      seatIndex = parsedSeat;
    } else {
      const targetParticipant = participantsById.get(target);
      if (targetParticipant && !targetParticipant.driver) {
        carId = targetParticipant.carId ?? null;
        seatIndex = targetParticipant.seatIndex ?? null;
      }
    }

    if (typeof carId === "undefined" || typeof seatIndex === "undefined")
      return;
    if (
      activeParticipant.carId === carId &&
      activeParticipant.seatIndex === seatIndex
    )
      return;

    mutate("/api/carpool/assign", {
      method: "POST",
      body: JSON.stringify({ riderId, carId, seatIndex }),
    });
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {sheetName}
              </h1>
              <p className="text-sm text-zinc-500">
                Mission Control for signups, carpools, and live check-in.
              </p>
            </div>
            <Link href="/">
              <Button variant="outline">← Back to Home</Button>
            </Link>
          </div>
        </header>

        <DashboardSummary stats={data.stats} />

        <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
          <div className="space-y-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Participants</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    List
                  </Button>
                  <Button
                    variant={viewMode === "table" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                  >
                    Table
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <FilterBar
                  searchTerm={searchTerm}
                  filterOfficer={filterOfficer}
                  filterRole={filterRole}
                  filterStatus={filterStatus}
                  sortBy={sortBy}
                  onSearchChange={setSearchTerm}
                  onFilterOfficerChange={setFilterOfficer}
                  onFilterRoleChange={setFilterRole}
                  onFilterStatusChange={setFilterStatus}
                  onSortByChange={setSortBy}
                  onReset={handleResetFilters}
                />
                {viewMode === "list" ? (
                  <ParticipantList
                    participants={filteredParticipants}
                    onStatusChange={(id, status) =>
                      updateParticipant(id, { status })
                    }
                    onSaveNotes={(id, appNotes) =>
                      updateParticipant(id, { appNotes })
                    }
                    onSavePreferences={(id, preferredRidePartners) =>
                      updateParticipant(id, { preferredRidePartners })
                    }
                    onSaveSeats={(id, seats) =>
                      updateParticipant(id, { seats })
                    }
                    onSaveDriverStatus={(id, driver, selfDriver) =>
                      updateParticipant(id, { driver, selfDriver })
                    }
                  />
                ) : (
                  <ParticipantTable
                    participants={filteredParticipants}
                    onStatusChange={updateParticipant}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle>Carpool Board</CardTitle>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      mutate("/api/carpool/auto-assign", {
                        method: "POST",
                        body: JSON.stringify({ prioritizeOfficers: true }),
                      })
                    }
                  >
                    Auto Assign
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <UnassignedLane>
                        {unassigned.map((participant) => (
                          <DraggableRider
                            key={participant.id}
                            participant={participant}
                          />
                        ))}
                      </UnassignedLane>
                    </div>
                    <div className="flex-1">
                      <SelfDriversLane selfDrivers={selfDrivers} />
                    </div>
                  </div>
                  {data.cars.map((car: Car) => (
                    <CarVisualization
                      key={car.id}
                      car={car}
                      participantsById={participantsById}
                    />
                  ))}
                </CardContent>
              </Card>
            </DndContext>

            <InsightPanel insights={data.insights} />
          </div>
        </div>

        {isPending ? (
          <p className="text-sm text-zinc-500">Updating operations board…</p>
        ) : null}
      </div>
    </main>
  );
}
