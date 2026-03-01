import type { EventStatus } from "@/types";

// Status color configuration map
const statusColorMap: Record<
  EventStatus,
  {
    bg: string;
    border: string;
    lightBg: string;
    text: string;
    darkText: string;
  }
> = {
  awaiting: {
    bg: "bg-zinc-900",
    border: "border-zinc-900",
    lightBg: "bg-zinc-100",
    text: "text-white",
    darkText: "text-zinc-900",
  },
  text_sent: {
    bg: "bg-purple-600",
    border: "border-purple-600",
    lightBg: "bg-purple-50",
    text: "text-white",
    darkText: "text-purple-900",
  },
  confirmed: {
    bg: "bg-green-600",
    border: "border-green-600",
    lightBg: "bg-green-50",
    text: "text-white",
    darkText: "text-green-900",
  },
  ambiguous: {
    bg: "bg-yellow-500",
    border: "border-yellow-500",
    lightBg: "bg-yellow-50",
    text: "text-white",
    darkText: "text-yellow-900",
  },
  cancelled: {
    bg: "bg-red-600",
    border: "border-red-600",
    lightBg: "bg-red-50",
    text: "text-white",
    darkText: "text-red-900",
  },
  present: {
    bg: "bg-blue-600",
    border: "border-blue-600",
    lightBg: "bg-blue-50",
    text: "text-white",
    darkText: "text-blue-900",
  },
};

export function getStatusColor(status: EventStatus): string {
  return statusColorMap[status]?.bg ?? "bg-zinc-200";
}

export function getStatusBorderColor(status: EventStatus): string {
  return statusColorMap[status]?.border ?? "border-zinc-200";
}

export function getStatusLightBgColor(status: EventStatus): string {
  return statusColorMap[status]?.lightBg ?? "bg-zinc-50";
}

export function getStatusTextColor(status: EventStatus): string {
  return statusColorMap[status]?.text ?? "text-zinc-900";
}

export function getStatusDarkTextColor(status: EventStatus): string {
  return statusColorMap[status]?.darkText ?? "text-zinc-900";
}

export function getStatusCardClass(status: EventStatus): string {
  const borderColor = getStatusBorderColor(status);
  const bgColor = getStatusLightBgColor(status);
  return `rounded-xl border-2 ${borderColor} ${bgColor}`;
}

export function getStatusSelectClass(status: EventStatus): string {
  const bgColor = getStatusLightBgColor(status);
  const borderColor = getStatusBorderColor(status);
  const textColor = getStatusDarkTextColor(status);

  return `rounded px-2 py-1 text-xs border-2 font-semibold ${borderColor} ${bgColor} ${textColor}`;
}

export function getStatusButtonClass(
  status: EventStatus,
  isActive: boolean,
): string {
  if (!isActive) {
    return "bg-zinc-200 text-zinc-700 hover:bg-zinc-300";
  }

  const ringColor: Record<EventStatus, string> = {
    awaiting: "",
    text_sent: "ring-1 ring-purple-400",
    confirmed: "ring-1 ring-green-400",
    ambiguous: "ring-1 ring-yellow-400",
    cancelled: "ring-1 ring-red-400",
    present: "ring-1 ring-blue-400 hover:bg-blue-700",
  };

  const bgColor = getStatusColor(status);
  const textColor = getStatusTextColor(status);
  const ring = ringColor[status] || "";

  return `${bgColor} ${textColor} ${ring}`;
}
