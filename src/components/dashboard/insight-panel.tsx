import { AlertTriangle, Lightbulb, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Insight } from "@/types";

const severityIcon = {
  low: Lightbulb,
  medium: AlertTriangle,
  high: ShieldAlert,
};

const severityVariant = {
  low: "info",
  medium: "warning",
  high: "danger",
} as const;

export function InsightPanel({ insights }: { insights: Insight[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Insights (Mock)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => {
          const Icon = severityIcon[insight.severity];
          return (
            <div
              key={insight.id}
              className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <Icon className="h-4 w-4" />
                  {insight.title}
                </div>
                <Badge variant={severityVariant[insight.severity]}>
                  {insight.severity}
                </Badge>
              </div>
              <p className="text-sm text-zinc-700">{insight.description}</p>
              {insight.suggestion ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Suggestion: {insight.suggestion}
                </p>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
