import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { TempPassword } from "@/app/dashboard/locks/[deviceId]/LockDetailClient";

const phaseMap: Record<string, string> = {
  "1": "Pending",
  "2": "Active",
  "3": "Frozen",
  "4": "Deleted",
  "5": "Failed",
};

interface TempPasswordRowProps {
  password: TempPassword;
  onClick: () => void;
}

export default function TempPasswordRow({
  password,
  onClick,
}: TempPasswordRowProps) {
  return (
    <div
      onClick={onClick}
      className="border-b last:border-b-0 p-4 hover:bg-muted/50 cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{password.name || "Unnamed"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {format(password.effective_time * 1000, "MMM d, h:mm a")} –{" "}
            {format(password.invalid_time * 1000, "h:mm a")}
          </p>
        </div>
        <Badge
          variant={
            password.phase === 2
              ? "default"
              : password.phase === 3
              ? "destructive"
              : "secondary"
          }
        >
          {phaseMap[password.phase] || password.phase}
        </Badge>
      </div>
    </div>
  );
}
