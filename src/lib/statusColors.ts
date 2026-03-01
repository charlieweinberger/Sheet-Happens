import type { EventStatus } from "@/types";

export function getStatusColor(status: EventStatus): string {
  switch (status) {
    case "awaiting":
      return "bg-zinc-900";
    case "text_sent":
      return "bg-purple-600";
    case "confirmed":
      return "bg-green-600";
    case "ambiguous":
      return "bg-yellow-500";
    case "cancelled":
      return "bg-red-600";
    case "present":
      return "bg-blue-600";
    default:
      return "bg-zinc-200";
  }
}

export function getStatusBorderColor(status: EventStatus): string {
  switch (status) {
    case "awaiting":
      return "border-zinc-900";
    case "text_sent":
      return "border-purple-600";
    case "confirmed":
      return "border-green-600";
    case "ambiguous":
      return "border-yellow-500";
    case "cancelled":
      return "border-red-600";
    case "present":
      return "border-blue-600";
    default:
      return "border-zinc-200";
  }
}

export function getStatusLightBgColor(status: EventStatus): string {
  switch (status) {
    case "awaiting":
      return "bg-zinc-100";
    case "text_sent":
      return "bg-purple-50";
    case "confirmed":
      return "bg-green-50";
    case "ambiguous":
      return "bg-yellow-50";
    case "cancelled":
      return "bg-red-50";
    case "present":
      return "bg-blue-50";
    default:
      return "bg-zinc-50";
  }
}

export function getStatusTextColor(status: EventStatus): string {
  switch (status) {
    case "awaiting":
    case "text_sent":
    case "confirmed":
    case "cancelled":
    case "present":
      return "text-white";
    case "ambiguous":
      return "text-white";
    default:
      return "text-zinc-900";
  }
}

export function getStatusDarkTextColor(status: EventStatus): string {
  switch (status) {
    case "awaiting":
      return "text-zinc-900";
    case "text_sent":
      return "text-purple-900";
    case "confirmed":
      return "text-green-900";
    case "ambiguous":
      return "text-yellow-900";
    case "cancelled":
      return "text-red-900";
    case "present":
      return "text-blue-900";
    default:
      return "text-zinc-900";
  }
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

export function getStatusButtonClass(status: EventStatus, isActive: boolean): string {
  if (!isActive) {
    return "bg-zinc-200 text-zinc-700 hover:bg-zinc-300";
  }
  
  switch (status) {
    case "awaiting":
      return "bg-zinc-900 text-white";
    case "text_sent":
      return "bg-purple-600 text-white ring-1 ring-purple-400";
    case "confirmed":
      return "bg-green-600 text-white ring-1 ring-green-400";
    case "ambiguous":
      return "bg-yellow-500 text-white ring-1 ring-yellow-400";
    case "cancelled":
      return "bg-red-600 text-white ring-1 ring-red-400";
    case "present":
      return "bg-blue-600 text-white ring-1 ring-blue-400 hover:bg-blue-700";
    default:
      return "bg-zinc-200 text-zinc-700 hover:bg-zinc-300";
  }
}
