import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats, Participant } from "@/types";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
}

function StatCard({ label, value, subtext }: StatCardProps) {
  return (
    <Card className="bg-linear-to-b from-white to-zinc-50">
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        {subtext && <p className="mt-1 text-xs text-zinc-500">{subtext}</p>}
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value, subtext }: StatCardProps) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 py-1 last:border-0">
      <span className="text-xs text-zinc-600">{label}</span>
      <div className="text-right">
        <p className="text-sm font-semibold">{value}</p>
        {subtext && <p className="text-xs text-zinc-500">{subtext}</p>}
      </div>
    </div>
  );
}

function generateSignupTimeline(participants: Participant[]) {
  if (participants.length === 0) return [];

  const signupsByTime: { [key: string]: number } = {};
  let cumulativeCount = 0;

  // Sort by timestamp
  const sorted = [...participants].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  sorted.forEach((p) => {
    const date = new Date(p.timestamp);
    // Format as "Jan 15, 2PM" (hourly)
    const timeKey = date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      hour12: true,
    });

    cumulativeCount++;
    if (!signupsByTime[timeKey]) {
      signupsByTime[timeKey] = cumulativeCount;
    } else {
      signupsByTime[timeKey] = cumulativeCount;
    }
  });

  return Object.entries(signupsByTime).map(([time, count]) => ({
    time,
    signups: count,
  }));
}

interface DashboardSummaryProps {
  stats: DashboardStats;
  participants?: Participant[];
}

export function DashboardSummary({
  stats,
  participants = [],
}: DashboardSummaryProps) {
  // Response status pie chart data
  const responseData = [
    { name: "Confirmed", value: stats.confirmed, fill: "#10b981" },
    { name: "Cancelled", value: stats.cancelled, fill: "#ef4444" },
    { name: "Awaiting", value: stats.awaitingResponse, fill: "#f59e0b" },
  ];

  // Rider assignment bar chart data
  const riderData = [
    { name: "Assigned", value: stats.assignedRiders, fill: "#3b82f6" },
    { name: "Unassigned", value: stats.unassignedRiders, fill: "#94a3b8" },
  ];

  // Signup timeline data
  const signupTimeline = generateSignupTimeline(participants);

  const totalRiders = stats.assignedRiders + stats.unassignedRiders;

  return (
    <div className="space-y-2">
      {/* Row 1: Response Status */}
      <div className="grid gap-2 md:grid-cols-4">
        <StatCard label="Total Signed Up" value={stats.totalSignedUp} />
        <StatCard label="Confirmed" value={stats.confirmed} />
        <StatCard label="Cancelled" value={stats.cancelled} />
        <StatCard label="Awaiting Response" value={stats.awaitingResponse} />
      </div>

      {/* Row 2: Signup Timeline & Charts and Key Metrics */}
      <div className="grid gap-2 md:grid-cols-4">
        {/* Signup Timeline Chart */}
        {signupTimeline.length > 0 && (
          <Card className="bg-linear-to-b from-white to-zinc-50">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs">Signup Timeline</CardTitle>
            </CardHeader>
            <CardContent className="h-32 pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={signupTimeline}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="signups"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 3 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Response Status Pie Chart */}
        <Card className="bg-linear-to-b from-white to-zinc-50">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs">Response Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex h-32 items-center justify-center pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={responseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {responseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Message Tracking */}
        <Card className="bg-linear-to-b from-white to-zinc-50">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs">Message Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0 text-xs">
            <StatRow label="Text Sent" value={stats.textSent} />
            <StatRow label="Ambiguous" value={stats.ambiguous} />
            <StatRow label="Present" value={stats.present} />
          </CardContent>
        </Card>

        {/* Seats Card */}
        <Card className="bg-linear-to-b from-white to-zinc-50">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs">Seats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0 text-xs">
            <StatRow label="Available" value={stats.totalSeatsAvailable} />
            <StatRow label="Used" value={stats.totalSeatsUsed} />
            <div className="mt-1 text-center text-sm font-bold text-blue-600">
              {stats.carpoolUtilization}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Drivers, Riders Chart & Stats */}
      <div className="grid gap-2 md:grid-cols-2">
        {/* Drivers Card */}
        <Card className="bg-linear-to-b from-white to-zinc-50">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs">Drivers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0 text-xs">
            <StatRow label="Total" value={stats.totalDrivers} />
            <StatRow label="Self-Drivers" value={stats.selfDrivers} />
            <StatRow label="Cars" value={stats.carsCreated} />
            <div className="border-t border-zinc-100 pt-1 text-right">
              <span className="text-xs text-zinc-600">
                Officers: {stats.officersAttending}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Riders Bar Chart */}
        <Card className="bg-linear-to-b from-white to-zinc-50">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs">Rider Assignment</CardTitle>
          </CardHeader>
          <CardContent className="h-24 pt-0">
            {totalRiders > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={riderData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {riderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                No riders yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Additional Stats */}
      <div className="grid gap-2 md:grid-cols-4">
        <StatCard label="Total Drivers" value={stats.totalDrivers} />
        <StatCard label="Self-Drivers" value={stats.selfDrivers} />
        <StatCard label="Total Riders" value={stats.totalRiders} />
        <StatCard label="Cars Created" value={stats.carsCreated} />
      </div>
    </div>
  );
}
