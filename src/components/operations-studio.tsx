"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Search, User } from "lucide-react";
import { DashboardSummary } from "@/components/dashboard-summary";
import { InsightPanel } from "@/components/insight-panel";
import { ParticipantCard } from "@/components/participant-card";
import { CarVisualization } from "@/components/car-visualization";
import { PreferredPartnersTooltip } from "@/components/preferred-partners-tooltip";
import { getStatusCardClass, getStatusDarkTextColor, getStatusSelectClass, getStatusBorderColor, getStatusLightBgColor } from "@/lib/statusColors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Car, EventData, EventStatus, Participant } from "@/types";

function DraggableRider({ participant }: { participant: Participant }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: participant.id,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-full rounded-md border-2 p-2 text-left text-sm flex items-center justify-between gap-2",
        getStatusBorderColor(participant.status),
        getStatusLightBgColor(participant.status),
      )}
      {...listeners}
      {...attributes}
      type="button"
    >
      <span className={getStatusDarkTextColor(participant.status)}>{participant.name}</span>
      <PreferredPartnersTooltip participant={participant} />
    </button>
  );
}

function UnassignedLane({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned" });

  return (
    <Card
      ref={setNodeRef}
      className={[
        "min-h-40 border-2 transition-colors",
        isOver ? "border-zinc-900" : "border-zinc-200",
      ].join(" ")}
    >
      <CardHeader>
        <CardTitle>Unassigned Riders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

async function fetchJson(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as EventData;
}

export function OperationsStudio({ initialData }: { initialData: EventData }) {
  const [data, setData] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<
    "all" | "officer" | "driver" | "self-driver" | "rider"
  >("all");
  const [filterStatus, setFilterStatus] = useState<"all" | EventStatus>("all");
  const [filterTextSent, setFilterTextSent] = useState<
    "all" | "sent" | "not-sent"
  >("all");
  const [sortBy, setSortBy] = useState<"name" | "status">("name");
  const [viewMode, setViewMode] = useState<"list" | "table">("list");
  const [isPending, startTransition] = useTransition();

  const participantsById = useMemo(
    () => new Map(data.participants.map((p) => [p.id, p])),
    [data.participants],
  );

  const filteredParticipants = useMemo(() => {
    let result = data.participants;

    // Search filter
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter((participant) =>
        `${participant.name} ${participant.email}`.toLowerCase().includes(term),
      );
    }

    // Role filter
    if (filterRole === "officer") {
      result = result.filter((p) => p.isOfficer);
    } else if (filterRole === "driver") {
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

    // Text sent filter
    if (filterTextSent === "sent") {
      result = result.filter(
        (p) =>
          p.status === "text_sent" ||
          p.status === "ambiguous" ||
          p.status === "confirmed" ||
          p.status === "cancelled" ||
          p.status === "present",
      );
    } else if (filterTextSent === "not-sent") {
      result = result.filter((p) => p.status === "awaiting");
    }

    // Sort
    if (sortBy === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "status") {
      const statusOrder: Record<EventStatus, number> = {
        awaiting: 0,
        text_sent: 1,
        ambiguous: 2,
        confirmed: 3,
        present: 4,
        cancelled: 5,
      };
      result = [...result].sort(
        (a, b) => statusOrder[a.status] - statusOrder[b.status],
      );
    }

    return result;
  }, [
    data.participants,
    searchTerm,
    filterRole,
    filterStatus,
    filterTextSent,
    sortBy,
  ]);

  const riders = data.participants.filter(
    (p) => !p.driver && !p.selfDriver && p.status !== "cancelled",
  );
  const selfDrivers = data.participants.filter(
    (p) => p.selfDriver && p.status !== "cancelled",
  );
  const driversById = useMemo(
    () =>
      new Map(data.participants.filter((p) => p.driver && !p.selfDriver).map((d) => [d.id, d])),
    [data.participants],
  );
  const unassigned = riders.filter((r) => {
    if (!r.carId) return true;
    const driverId = r.carId.replace("car-", "");
    const driver = driversById.get(driverId);
    return !driver || driver.status === "cancelled";
  });

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
          <h1 className="text-2xl font-bold tracking-tight">
            Event Operations Studio
          </h1>
          <p className="text-sm text-zinc-500">
            Mission Control for signups, carpools, and live check-in.
          </p>
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
                <div className="mb-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm"
                      value={filterRole}
                      onChange={(e) =>
                        setFilterRole(e.target.value as typeof filterRole)
                      }
                    >
                      <option value="all">All Roles</option>
                      <option value="officer">Officers</option>
                      <option value="driver">Drivers</option>
                      <option value="self-driver">Self-Drivers</option>
                      <option value="rider">Riders</option>
                    </select>
                    <select
                      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm"
                      value={filterStatus}
                      onChange={(e) =>
                        setFilterStatus(e.target.value as typeof filterStatus)
                      }
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
                      value={filterTextSent}
                      onChange={(e) =>
                        setFilterTextSent(
                          e.target.value as typeof filterTextSent,
                        )
                      }
                    >
                      <option value="all">Text Status</option>
                      <option value="sent">Text Sent</option>
                      <option value="not-sent">Text Not Sent</option>
                    </select>
                    <select
                      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm"
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(e.target.value as typeof sortBy)
                      }
                    >
                      <option value="name">Sort: Name</option>
                      <option value="status">Sort: Status</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setFilterRole("all");
                        setFilterStatus("all");
                        setFilterTextSent("all");
                      }}
                    >
                      Reset Filters
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input
                      className="pl-8"
                      placeholder="Search by name or email"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                {viewMode === "list" ? (
                  <div className="grid gap-3">
                    {filteredParticipants.map((participant) => (
                      <div
                        key={participant.id}
                        className={getStatusCardClass(participant.status)}
                      >
                        <ParticipantCard
                          participant={participant}
                          onStatusChange={(id, status: EventStatus) =>
                            updateParticipant(id, { status })
                          }
                          onSaveNotes={(id, appNotes) =>
                            updateParticipant(id, { appNotes })
                          }
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200">
                          <th className="px-3 py-2 text-left font-semibold text-zinc-900">
                            Name
                          </th>
                          <th className="px-3 py-2 text-left font-semibold text-zinc-900">
                            Email
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
                        </tr>
                      </thead>
                      <tbody>
                        {filteredParticipants.map((participant) => (
                          <tr
                            key={participant.id}
                            className="border-b border-zinc-100 hover:bg-zinc-50"
                          >
                            <td className="px-3 py-2 text-zinc-900">
                              <div className="flex items-center gap-2">
                                {participant.name}
                                {participant.isOfficer && <User className="h-4 w-4" />}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-zinc-600 text-xs">
                              {participant.email}
                            </td>
                            <td className="px-3 py-2 text-zinc-600 text-xs">
                              {participant.selfDriver
                                ? "Self-Driver"
                                : participant.driver
                                  ? `Driver (${participant.seats} seat${participant.seats > 1 ? "s" : ""})`
                                  : "Rider"}
                            </td>
                            <td className="px-3 py-2 text-zinc-600 text-xs">
                              {participant.preferredRidePartners?.length ? participant.preferredRidePartners.join(", ") : "-"}
                            </td>
                            <td className="px-3 py-2">
                              <select
                                className={getStatusSelectClass(participant.status)}
                                value={`${participant.status}|${participant.checkInState}`}
                                onChange={(e) => {
                                  const [status, checkInState] =
                                    e.target.value.split("|");
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

                                  updateParticipant(
                                    participant.id,
                                    updatedPayload,
                                  );
                                }}
                              >
                                <optgroup label="Signed Up">
                                  <option value="awaiting|null">
                                    Signed Up
                                  </option>
                                </optgroup>
                                <optgroup label="Text Sent">
                                  <option value="text_sent|null">
                                    Text Sent
                                  </option>
                                </optgroup>
                                <optgroup label="Response">
                                  <option value="confirmed|null">
                                    Confirmed
                                  </option>
                                  <option value="ambiguous|null">
                                    Ambiguous Response
                                  </option>
                                  <option value="cancelled|null">
                                    Cancelled
                                  </option>
                                </optgroup>
                                <optgroup label="Present">
                                  <option value="present|null">Present</option>
                                </optgroup>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                      <Card className="min-h-40 border-2 border-zinc-200">
                        <CardHeader>
                          <CardTitle>Self-Drivers</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {selfDrivers.map((participant) => (
                            <div
                              key={participant.id}
                              className={cn(
                                "w-full rounded-md border-2 p-2 text-left text-sm flex items-center justify-between gap-2",
                                getStatusBorderColor(participant.status),
                                getStatusLightBgColor(participant.status),
                              )}
                            >
                              <span className={getStatusDarkTextColor(participant.status)}>{participant.name}</span>
                              <PreferredPartnersTooltip participant={participant} />
                            </div>
                          ))}
                        </CardContent>
                      </Card>
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
