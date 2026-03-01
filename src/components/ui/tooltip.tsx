"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function Tooltip({
  children,
  content,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={cn(
            "absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 transform",
            "rounded-md bg-zinc-900 px-3 py-2 text-xs text-white shadow-lg",
            "pointer-events-none whitespace-nowrap",
          )}
        >
          {content}
          <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 transform border-x-4 border-t-4 border-x-transparent border-t-zinc-900" />
        </div>
      )}
    </div>
  );
}
