"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WaitlistLaneProps {
  children: React.ReactNode;
}

export function WaitlistLane({ children }: WaitlistLaneProps) {
  return (
    <Card className="min-h-40 border-2 border-zinc-200">
      <CardHeader>
        <CardTitle>Waitlist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}
