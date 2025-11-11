// src/app/dashboard/locks/[deviceId]/LockDetailClient.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Battery,
  Lock,
  Unlock,
  Key,
  UserPlus,
  Trash2,
  BellRing,
} from "lucide-react";
import useSWR from "swr";
import { fetcher, postApi } from "@/lib/api-client";
import { eventMap } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import LogDetailDialog from "@/components/ui/LogDetailDialog";

interface Device {
  id: string;
  name: string;
  is_online: boolean;
  status?: { code: string; value: any }[];
}
interface User {
  user_id: string;
  nick_name: string;
  avatar?: string;
  role: "admin" | "normal";
}

// Unified Log Type (supports both unlock & alarm)
interface BaseLog {
  update_time: number;
  user_id?: string;
  nick_name?: string;
}
interface UnlockLog extends BaseLog {
  status: { code: string; value: any };
}
interface AlarmLog extends BaseLog {
  status: { code: string; value: any }[] | { code: string; value: any };
  media_infos?: Array<{ file_key: string; file_url: string }>;
}
type Log = UnlockLog | AlarmLog;

const endTime = Date.now();
const startTime = endTime - 7 * 24 * 60 * 60 * 1000;

export default function LockDetailClient({
  deviceId,
  initialDevice,
}: {
  deviceId: string;
  initialDevice: Device;
}) {
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ nick_name: "", sex: "male" });

  // Dialog state
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: deviceData } = useSWR<{ result: Device }>(
    `/api/devices/${deviceId}/details`,
    fetcher,
    { fallbackData: { result: initialDevice } }
  );

  const { data: statusData, mutate: mutateStatus } = useSWR<{
    result: { code: string; value: any }[];
  }>(`/api/devices/${deviceId}/status`, fetcher, { refreshInterval: 10000 });

  const { data: usersData, mutate: mutateUsers } = useSWR<{ result: User[] }>(
    `/api/devices/${deviceId}/users`,
    fetcher
  );

  const unlockUrl = `/api/devices/${deviceId}/logs/unlock?page_no=1&page_size=20&start_time=${startTime}&end_time=${endTime}`;
  const alarmUrl = `/api/devices/${deviceId}/logs/alarm?page_no=1&page_size=10&start_time=${startTime}&end_time=${endTime}`;

  const { data: unlockLogs } = useSWR<{ result: { logs: UnlockLog[] } }>(
    unlockUrl,
    fetcher
  );
  const { data: alarmLogs } = useSWR<{ result: { logs: AlarmLog[] } }>(
    alarmUrl,
    fetcher
  );

  const device = deviceData?.result || initialDevice;
  const statusMap = Object.fromEntries(
    statusData?.result?.map((s) => [s.code, s.value]) || []
  );
  const battery = statusMap.battery_percentage ?? statusMap.battery_state;
  const isLocked =
    statusMap.lock_state === "locked" || statusMap.door_state === "closed";

  const handleRemoteUnlock = async () => {
    setUnlockLoading(true);
    try {
      await postApi(`/api/devices/${deviceId}/unlock`, {});
      toast.success("Door unlocked remotely!");
      mutateStatus();
    } catch (err: any) {
      toast.error(err.message || "Unlock failed");
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.nick_name.trim()) return toast.error("Name required");
    try {
      await postApi(`/api/devices/${deviceId}/users`, newUser);
      toast.success("User added");
      setAddUserOpen(false);
      setNewUser({ nick_name: "", sex: "male" });
      mutateUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to add user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Delete this user?")) return;
    try {
      await fetch(`/api/devices/${deviceId}/users/${userId}`, {
        method: "DELETE",
      });
      toast.success("User deleted");
      mutateUsers();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleRoleChange = async (userId: string, role: "admin" | "normal") => {
    try {
      await fetch(`/api/devices/${deviceId}/users/${userId}/actions/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      toast.success("Role updated");
      mutateUsers();
    } catch {
      toast.error("Update failed");
    }
  };

  const openLogDetail = (log: Log) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Lock className="h-8 w-8" />
            {device.name}
          </h1>
          <p className="text-muted-foreground mt-1">ID: {device.id}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge
            variant={device.is_online ? "default" : "secondary"}
            className="text-lg px-4"
          >
            {device.is_online ? "Online" : "Offline"}
          </Badge>
          <Button
            size="lg"
            onClick={handleRemoteUnlock}
            disabled={unlockLoading || !device.is_online}
          >
            <Unlock className="h-5 w-5 mr-2" />
            {unlockLoading ? "Unlocking..." : "Remote Unlock"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Door State
                </CardTitle>
                {isLocked ? (
                  <Lock className="h-5 w-5 text-destructive" />
                ) : (
                  <Unlock className="h-5 w-5 text-green-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLocked ? "Locked" : "Unlocked"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Battery</CardTitle>
                <Battery className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {typeof battery === "number"
                    ? `${battery}%`
                    : battery === "low"
                    ? "Low"
                    : "Normal"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Key className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usersData?.result?.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lock Users</CardTitle>
                <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" /> Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={newUser.nick_name}
                          onChange={(e) =>
                            setNewUser({
                              ...newUser,
                              nick_name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Gender</Label>
                        <Select
                          value={newUser.sex}
                          onValueChange={(v) =>
                            setNewUser({ ...newUser, sex: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddUser} className="w-full">
                        Add User
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.result?.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="bg-muted rounded-full w-10 h-10 flex items-center justify-center text-xs">
                            {user.nick_name[0] || "?"}
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.nick_name || "Unnamed"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.user_id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(v) =>
                            handleRoleChange(
                              user.user_id,
                              v as "admin" | "normal"
                            )
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteUser(user.user_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Tabs defaultValue="unlock">
            <TabsList className="mb-4">
              <TabsTrigger value="unlock">Unlock Logs</TabsTrigger>
              <TabsTrigger value="alarm">Alarms</TabsTrigger>
            </TabsList>

            <TabsContent value="unlock">
              <Card>
                <CardHeader>
                  <CardTitle>Unlock History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Method</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unlockLogs?.result?.logs?.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center text-muted-foreground py-8"
                          >
                            No unlock events in last 7 days
                          </TableCell>
                        </TableRow>
                      ) : (
                        unlockLogs?.result?.logs?.map((log) => (
                          <TableRow
                            key={log.update_time}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => openLogDetail(log)}
                          >
                            <TableCell>
                              {format(log.update_time, "MMM d, h:mm a")}
                            </TableCell>
                            <TableCell>
                              {log.nick_name || `ID: ${log.user_id}`}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {eventMap[log.status.code] || log.status.code}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alarm">
              <Card>
                <CardHeader>
                  <CardTitle>Alarm Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Event</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alarmLogs?.result?.logs?.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="text-center text-muted-foreground py-8"
                          >
                            No alarms in last 7 days
                          </TableCell>
                        </TableRow>
                      ) : (
                        alarmLogs?.result?.logs?.map((log) => {
                          const statusArray = Array.isArray(log.status)
                            ? log.status
                            : [log.status];
                          const primaryCode = statusArray[0].code;
                          const hasMedia = !!log.media_infos?.length;

                          return (
                            <TableRow
                              key={log.update_time}
                              className="cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => openLogDetail(log)}
                            >
                              <TableCell>
                                {format(log.update_time, "MMM d, h:mm a")}
                              </TableCell>
                              <TableCell className="text-destructive">
                                <BellRing className="inline h-4 w-4 mr-2" />
                                {eventMap[primaryCode] || primaryCode}
                                {hasMedia && " (Photo/Video)"}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Device Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced settings coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* REUSABLE LOG DETAIL DIALOG */}
      {selectedLog && (
        <LogDetailDialog
          log={selectedLog}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          deviceId={deviceId}
        />
      )}
    </div>
  );
}
