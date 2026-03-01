"use client";

import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Car, Participant } from "@/types";

export function CarCard({
  car,
  riders,
  highlight = false,
  children,
}: {
  car: Car;
  riders: Participant[];
  highlight?: boolean;
  children?: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `car:${car.id}`,
  });

  return (
    <Card
      ref={setNodeRef}
      className={[
        "min-h-40 border-2 transition-colors",
        isOver || highlight ? "border-zinc-900" : "border-zinc-200",
      ].join(" ")}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{car.driverName}</span>
          <Badge
            variant={car.seatsUsed >= car.seatsTotal ? "warning" : "success"}
          >
            {car.seatsUsed}/{car.seatsTotal}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {children ||
          riders.map((rider) => <div key={rider.id}>{rider.name}</div>)}
      </CardContent>
    </Card>
  );
}
