import { User } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

export function OfficerIcon({ className }: { className?: string }) {
  return (
    <Tooltip content="Officer">
      <User className={className} />
    </Tooltip>
  );
}
