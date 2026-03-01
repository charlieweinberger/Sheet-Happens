import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/types";

export function DashboardSummary({ stats }: { stats: DashboardStats }) {
  const cards = [
    { label: "Total Signed Up", value: stats.totalSignedUp },
    { label: "Confirmed", value: stats.confirmed },
    { label: "Cancelled", value: stats.cancelled },
    { label: "Awaiting Response", value: stats.awaitingResponse },
    { label: "Cars Created", value: stats.carsCreated },
    { label: "Officers Attending", value: stats.officersAttending },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="bg-linear-to-b from-white to-zinc-50"
        >
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
