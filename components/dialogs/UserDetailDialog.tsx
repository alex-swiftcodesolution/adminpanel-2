// src/components/dialogs/UserDetailDialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Key, Shield, Plus } from "lucide-react";
import useSWR from "swr";
import { fetcher, postApi } from "@/lib/api-client";
import { toast } from "sonner";

interface UnlockKey {
  unlock_no: number;
  unlock_type: "fingerprint" | "password" | "card" | "remoteControl";
  hijack?: boolean;
}

interface User {
  user_id: string;
  nick_name: string;
  role: "admin" | "normal";
}

interface UserDetailDialogProps {
  deviceId: string;
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: () => void;
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */
export default function UserDetailDialog({
  deviceId,
  user,
  open,
  onOpenChange,
  onDelete,
}: UserDetailDialogProps) {
  /* ---------- Role state – reset when dialog opens or user changes ---------- */
  const [role, setRole] = useState(user.role);

  const [selectedUnassignedKey, setSelectedUnassignedKey] =
    useState<UnlockKey | null>(null);

  /* ------------------- Fetch unassigned keys (device level) ------------------- */
  const {
    data: unassignedData,
    mutate: mutateUnassigned,
    isLoading: loadingUnassigned,
  } = useSWR<UnlockKey[]>(
    open ? `/api/devices/${deviceId}/credentials/unassigned` : null,
    fetcher
  );

  /* -------------------------------- Handlers -------------------------------- */
  const handleRoleChange = async () => {
    try {
      await fetch(
        `/api/devices/${deviceId}/users/${user.user_id}/actions/role`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        }
      );
      toast.success("Role updated");
      // Refresh the users list in the parent component
      // (LockDetailClient uses its own SWR key)
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleAssign = async () => {
    if (!selectedUnassignedKey) return toast.error("Select a key to assign");

    try {
      await postApi(
        `/api/devices/${deviceId}/users/${user.user_id}/credentials/assign`,
        {
          unlock_sn: selectedUnassignedKey.unlock_no,
          unlock_type: selectedUnassignedKey.unlock_type,
        }
      );
      toast.success("Credential assigned");
      setSelectedUnassignedKey(null);
      mutateUnassigned(); // Refresh unassigned list
    } catch {
      toast.error("Failed to assign credential");
    }
  };

  const handleUnbind = async (
    unlock_list: Array<{ no: number; type: string }>
  ) => {
    try {
      await postApi(
        `/api/devices/${deviceId}/users/${user.user_id}/credentials/unbind`,
        { unlock_list }
      );
      toast.success("Credentials unbound");
      mutateUnassigned(); // Refresh
    } catch {
      toast.error("Failed to unbind");
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm("Delete this user permanently?")) return;

    try {
      await fetch(`/api/devices/${deviceId}/users/${user.user_id}`, {
        method: "DELETE",
      });
      toast.success("User deleted");
      onDelete?.();
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete user");
    }
  };

  /* ------------------------------- UI Helpers ------------------------------- */
  const typeDisplay: Record<string, string> = {
    fingerprint: "Fingerprint",
    password: "Password",
    card: "Card",
    remoteControl: "Remote",
    face: "Face",
  };

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */
  return (
    <Dialog
      key={open ? user.user_id : "closed"}
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {user.nick_name || "Unnamed User"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6 py-4">
          {/* --------------------------- Role --------------------------- */}
          <div>
            <Label>Role</Label>
            <div className="flex gap-2 mt-1">
              <Select
                value={role}
                onValueChange={(v) => setRole(v as "admin" | "normal")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleRoleChange}
                disabled={role === user.role}
                size="sm"
              >
                Save
              </Button>
            </div>
          </div>

          <Separator />

          {/* ---------------------- Tabs: Assign | Manage ---------------------- */}
          <Tabs defaultValue="assign" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assign">
                Assign New <Key className="h-4 w-4 ml-1" />
              </TabsTrigger>
              <TabsTrigger value="manage">
                Manage Assigned <Trash2 className="h-4 w-4 ml-1" />
              </TabsTrigger>
            </TabsList>

            {/* -------------------------- Assign New -------------------------- */}
            <TabsContent value="assign" className="space-y-4">
              <Label>Available Unassigned Keys</Label>
              {loadingUnassigned ? (
                <p className="text-sm text-muted-foreground">
                  Loading available keys...
                </p>
              ) : unassignedData?.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No unassigned keys available
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unassignedData && unassignedData.length > 0 ? (
                        unassignedData.map((key) => (
                          <TableRow key={`${key.unlock_type}-${key.unlock_no}`}>
                            <TableCell className="font-mono">
                              #{key.unlock_no}
                            </TableCell>
                            <TableCell>
                              <Badge>
                                {typeDisplay[key.unlock_type] ||
                                  key.unlock_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant={
                                  selectedUnassignedKey?.unlock_no ===
                                  key.unlock_no
                                    ? "default"
                                    : "outline"
                                }
                                onClick={() =>
                                  setSelectedUnassignedKey(
                                    selectedUnassignedKey?.unlock_no ===
                                      key.unlock_no
                                      ? null
                                      : key
                                  )
                                }
                              >
                                {selectedUnassignedKey?.unlock_no ===
                                key.unlock_no
                                  ? "Selected"
                                  : "Assign"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4">
                            no unassigned passwords available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
              {selectedUnassignedKey && (
                <Button onClick={handleAssign} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Assign #{selectedUnassignedKey.unlock_no} (
                  {typeDisplay[selectedUnassignedKey.unlock_type]}) to{" "}
                  {user.nick_name}
                </Button>
              )}
            </TabsContent>

            {/* ----------------------- Manage Assigned (Unbind) ----------------------- */}
            <TabsContent value="manage" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Unbind to make keys available for reassignment. (Assigned keys
                are visible in unlock logs / records)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Example placeholder – replace with real assigned keys later */}
                <Button
                  variant="outline"
                  onClick={() => handleUnbind([{ no: 1, type: "password" }])}
                >
                  Unbind Password 1
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          {/* ------------------------------ Delete ------------------------------ */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteUser}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete User
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
