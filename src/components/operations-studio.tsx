"use client";

import { useMemo, useState, useTransition } from "react";
import { DndContext, DragEndEvent, closestCenter, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Search } from "lucide-react";
import { DashboardSummary } from "@/components/dashboard-summary";
import { InsightPanel } from "@/components/insight-panel";
import { ParticipantCard } from "@/components/participant-card";
import { CarVisualization } from "@/components/car-visualization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Car, EventData, EventStatus, Participant } from "@/types";

function DraggableRider({ participant }: { participant: Participant }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
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
      className="w-full rounded-md border border-zinc-200 bg-white p-2 text-left text-sm"
      {...listeners}
      {...attributes}
      type="button"
    >
      {participant.name}
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
  const [isPending, startTransition] = useTransition();

  const participantsById = useMemo(
    () => new Map(data.participants.map((p) => [p.id, p])),
    [data.participants],
  );

  const filteredParticipants = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return data.participants;

    return data.participants.filter((participant) =>
      `${participant.name} ${participant.email}`.toLowerCase().includes(term),
    );
  }, [data.participants, searchTerm]);

  const riders = data.participants.filter((p) => !p.driver && p.status !== "cancelled");
  const unassigned = riders.filter((r) => !r.carId);

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

    if (typeof carId === "undefined" || typeof seatIndex === "undefined") return;
    if (activeParticipant.carId === carId && activeParticipant.seatIndex === seatIndex) return;

    mutate("/api/carpool/assign", {
      method: "POST",
      body: JSON.stringify({ riderId, carId, seatIndex }),
    });
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Event Operations Studio</h1>
            <p className="text-sm text-zinc-500">Mission Control for signups, carpools, and live check-in.</p>
          </div>

          <Button
            variant="secondary"
            onClick={() =>
              mutate("/api/carpool/auto-assign", {
                method: "POST",
                body: JSON.stringify({ prioritizeOfficers: true }),
              })
            }
          >
            Auto Assign Carpools
          </Button>
        </header>

        <DashboardSummary stats={data.stats} />

        <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-3 relative">
                  <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    className="pl-8"
                    placeholder="Search by name or email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="grid gap-3">
                  {filteredParticipants.map((participant) => (
                    <ParticipantCard
                      key={participant.id}
                      participant={participant}
                      onStatusChange={(id, status: EventStatus) => updateParticipant(id, { status })}
                      onSaveNotes={(id, appNotes) => updateParticipant(id, { appNotes })}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <Card>
                <CardHeader>
                  <CardTitle>Carpool Board</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <UnassignedLane>
                    {unassigned.map((participant) => (
                      <DraggableRider key={participant.id} participant={participant} />
                    ))}
                  </UnassignedLane>
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
