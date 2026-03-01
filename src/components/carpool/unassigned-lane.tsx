"use client";

import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UnassignedLaneProps {
  children: React.ReactNode;
}

export function UnassignedLane({ children }: UnassignedLaneProps) {
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
