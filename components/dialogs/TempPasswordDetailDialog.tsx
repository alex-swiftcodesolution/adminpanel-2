"use client";

import { format } from "date-fns";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { postApi } from "@/lib/api-client";
import { TempPassword } from "@/app/dashboard/locks/[deviceId]/LockDetailClient";

const phaseMap: Record<string, string> = {
  "1": "Pending",
  "2": "Active",
  "3": "Frozen",
  "4": "Deleted",
  "5": "Failed",
  "0": "Deleted",
  "7": "Failed",
};

interface TempPasswordDetailDialogProps {
  deviceId: string;
  password: TempPassword;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function TempPasswordDetailDialog({
  deviceId,
  password,
  onOpenChange,
  onSuccess,
}: TempPasswordDetailDialogProps) {
  const isActive = password.phase === 2 || password.phase === "2";
  const isFrozen = password.phase === 3 || password.phase === "3";

  const handleFreeze = async () => {
    try {
      await postApi(
        `/api/devices/${deviceId}/temp-passwords/${password.id}/freeze-password`,
        {}
      );
      toast.success("Password frozen");
      onSuccess();
    } catch {
      toast.error("Failed to freeze");
    }
  };

  const handleUnfreeze = async () => {
    try {
      await postApi(
        `/api/devices/${deviceId}/temp-passwords/${password.id}/unfreeze-password`,
        {}
      );
      toast.success("Password unfrozen");
      onSuccess();
    } catch {
      toast.error("Failed to unfreeze");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this temporary password?")) return;
    try {
      await fetch(`/api/devices/${deviceId}/temp-passwords/${password.id}`, {
        method: "DELETE",
      });
      toast.success("Password deleted");
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{password.name || "Unnamed Password"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div>
          <Label className="text-xs text-muted-foreground">Status</Label>
          <div className="mt-1">
            <Badge
              variant={
                isActive ? "default" : isFrozen ? "destructive" : "secondary"
              }
            >
              {phaseMap[password.phase] || `Phase ${password.phase}`}
            </Badge>
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Valid Period</Label>
          <p className="mt-1 font-medium">
            {format(password.effective_time * 1000, "PPP p")} →{" "}
            {format(password.invalid_time * 1000, "PPP p")}
          </p>
        </div>

        {password.phone && (
          <div>
            <Label className="text-xs text-muted-foreground">Phone</Label>
            <p className="mt-1">{password.phone}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-3">
          {isActive && (
            <Button size="sm" variant="outline" onClick={handleFreeze}>
              Freeze
            </Button>
          )}
          {isFrozen && (
            <Button size="sm" variant="outline" onClick={handleUnfreeze}>
              Unfreeze
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
