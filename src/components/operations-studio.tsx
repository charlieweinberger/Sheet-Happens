"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { DashboardSummary } from "@/components/dashboard/dashboard-summary";
import { InsightPanel } from "@/components/dashboard/insight-panel";
import { ManualReviewPanel } from "@/components/dashboard/manual-review-panel";
import { ParticipantList } from "@/components/participants/participant-list";
import { ParticipantTable } from "@/components/participants/participant-table";
import { CarVisualization } from "@/components/carpool/car-visualization";
import { DraggableRider } from "@/components/carpool/draggable-rider";
import { UnassignedLane } from "@/components/carpool/unassigned-lane";
import { WaitlistLane } from "@/components/carpool/waitlist-lane";
import { SelfDriversLane } from "@/components/carpool/self-drivers-lane";
import VoiceControl from "@/components/voice-control";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Car, EventData } from "@/types";

export function OperationsStudio({
  initialData,
  sheetName,
  sheetId,
}: {
  initialData: EventData;
  sheetName: string;
  sheetId: string;
}) {
  const [data, setData] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOfficer, setFilterOfficer] = useState<FilterOfficer>("all");
  const [filterRole, setFilterRole] = useState<FilterRole>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [viewMode, setViewMode] = useState<"list" | "table">("list");
  const [autoAssignEligibility, setAutoAssignEligibility] = useState<
    "all" | "confirmed" | "present"
  >("all");
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

  const totalRiderSeatCapacity = useMemo(
    () => data.cars.reduce((sum, car) => sum + car.seatsTotal, 0),
    [data.cars],
  );

  const assignedRiderCount = useMemo(
    () => riders.length - unassigned.length,
    [riders.length, unassigned.length],
  );

  const { ridersStillUnassigned, waitlist } = useMemo(() => {
    const seatsRemaining = Math.max(totalRiderSeatCapacity - assignedRiderCount, 0);

    const prioritizedUnassigned = [...unassigned].sort((a, b) => {
      if (a.isPaidMember !== b.isPaidMember) {
        return a.isPaidMember ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    const canStillBePlacedCount = Math.min(
      seatsRemaining,
      prioritizedUnassigned.length,
    );

    return {
      ridersStillUnassigned: prioritizedUnassigned.slice(0, canStillBePlacedCount),
      waitlist: prioritizedUnassigned.slice(canStillBePlacedCount),
    };
  }, [unassigned, totalRiderSeatCapacity, assignedRiderCount]);

  function mutate(path: string, init: RequestInit) {
    startTransition(async () => {
      const next = await fetchJson(path, init);
      setData(next);
    });
  }

  function updateParticipant(participantId: string, payload: object) {
    mutate(`/api/participants/${participantId}`, {
      method: "PATCH",
      body: JSON.stringify({ ...payload, sheetId }),
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
      body: JSON.stringify({ riderId, carId, seatIndex, sheetId }),
    });
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-4 md:p-6">
      <div className="mx-auto max-w-450 space-y-5">
        <header className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{sheetName}</h1>
              <p className="text-sm text-zinc-500">
                Mission Control for signups, carpools, and live check-in.
              </p>
            </div>
            <Link href="/">
              <Button variant="outline">← Back to Home</Button>
            </Link>
          </div>
        </header>

        <Tabs defaultValue="participants" className="w-full">
          <div className="flex justify-center">
            <TabsList className="mb-4 space-x-4">
              <TabsTrigger value="participants">Participants</TabsTrigger>
              <TabsTrigger value="carpool">Carpool</TabsTrigger>
              <TabsTrigger value="dashboard">Statistics</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="participants">
            <div className="grid gap-5 xl:grid-cols-[1fr_400px]">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      {viewMode === "list" ? (
                        <ParticipantList
                          participants={filteredParticipants.slice(
                            0,
                            Math.ceil(filteredParticipants.length / 2),
                          )}
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
                          onUpdateParticipant={updateParticipant}
                        />
                      ) : (
                        <ParticipantTable
                          participants={filteredParticipants.slice(
                            0,
                            Math.ceil(filteredParticipants.length / 2),
                          )}
                          onStatusChange={updateParticipant}
                        />
                      )}
                    </div>

                    <div>
                      {viewMode === "list" ? (
                        <ParticipantList
                          participants={filteredParticipants.slice(
                            Math.ceil(filteredParticipants.length / 2),
                          )}
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
                          onUpdateParticipant={updateParticipant}
                        />
                      ) : (
                        <ParticipantTable
                          participants={filteredParticipants.slice(
                            Math.ceil(filteredParticipants.length / 2),
                          )}
                          onStatusChange={updateParticipant}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-5">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Filters</CardTitle>
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
                  </CardContent>
                </Card>
                <ManualReviewPanel
                  participants={data.participants}
                  onUpdateParticipant={updateParticipant}
                />
                <InsightPanel insights={data.insights} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="carpool">
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <div className="grid gap-5 xl:grid-cols-[1fr_400px]">
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-3">
                        {data.cars
                          .slice(0, Math.ceil(data.cars.length / 2))
                          .map((car: Car) => (
                            <CarVisualization
                              key={car.id}
                              car={car}
                              participantsById={participantsById}
                            />
                          ))}
                      </div>

                      <div className="space-y-3">
                        {data.cars
                          .slice(Math.ceil(data.cars.length / 2))
                          .map((car: Car) => (
                            <CarVisualization
                              key={car.id}
                              car={car}
                              participantsById={participantsById}
                            />
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-5">
                  <VoiceControl
                    participants={data.participants}
                    onCommandExecuted={() => {
                      // Refresh data after voice command execution
                      startTransition(async () => {
                        const next = await fetchJson("/api/event-data", {
                          method: "POST",
                          body: JSON.stringify({ sheetId }),
                        });
                        setData(next);
                      });
                    }}
                    onError={(error) => {
                      console.error("Voice control error:", error);
                    }}
                  />
                  <Card>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            mutate("/api/carpool/auto-assign", {
                              method: "POST",
                              body: JSON.stringify({
                                prioritizeOfficers: true,
                                assignmentScope: autoAssignEligibility,
                                sheetId,
                              }),
                            })
                          }
                        >
                          Auto Assign
                        </Button>

                        <label className="block text-xs text-zinc-600">
                          Auto-assign only:
                        </label>
                        <select
                          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
                          value={autoAssignEligibility}
                          onChange={(e) =>
                            setAutoAssignEligibility(
                              e.target.value as "all" | "confirmed" | "present",
                            )
                          }
                        >
                          <option value="all">Everyone</option>
                          <option value="confirmed">Confirmed only</option>
                          <option value="present">Present only</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                  <UnassignedLane>
                    {ridersStillUnassigned.map((participant) => (
                      <DraggableRider
                        key={participant.id}
                        participant={participant}
                      />
                    ))}
                  </UnassignedLane>
                  <WaitlistLane>
                    {waitlist.map((participant) => (
                      <DraggableRider
                        key={participant.id}
                        participant={participant}
                      />
                    ))}
                  </WaitlistLane>
                  <SelfDriversLane selfDrivers={selfDrivers} />
                </div>
              </div>
            </DndContext>
          </TabsContent>

          <TabsContent value="dashboard">
            <DashboardSummary stats={data.stats} participants={data.participants} />
          </TabsContent>
        </Tabs>

        {isPending ? (
          <p className="text-sm text-zinc-500">Updating operations board…</p>
        ) : null}
      </div>
    </main>
  );
}
