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
  Battery,
  BatteryLow,
  Lock,
  Unlock,
  Key,
  UserPlus,
  BellRing,
  Wifi,
  WifiOff,
  Plus,
} from "lucide-react";
import useSWR from "swr";
import { fetcher, postApi } from "@/lib/api-client";
import { eventMap, phaseMap } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import LogDetailDialog from "@/components/dialogs/LogDetailDialog";
import TempPasswordDialog from "@/components/dialogs/TempPasswordDialog";
import TempPasswordDetailDialog from "@/components/dialogs/TempPasswordDetailDialog";
import TempPasswordRow from "@/components/TempPasswordRow";
import UserDetailDialog from "@/components/dialogs/UserDetailDialog";

interface DeviceStatus {
  code: string;
  value: string | number | boolean;
}

interface TuyaDevice {
  id: string;
  name: string;
  is_online: boolean;
  status?: DeviceStatus[];
}

interface User {
  user_id: string;
  nick_name: string;
  avatar?: string;
  role: "admin" | "normal";
}

interface BaseLog {
  update_time: number;
  user_id?: string;
  nick_name?: string;
  media_infos?: Array<{ file_key: string; file_url: string }>;
}

interface UnlockLog extends BaseLog {
  status: DeviceStatus;
}

interface AlarmLog extends BaseLog {
  status: DeviceStatus[] | DeviceStatus;
}

type Log = UnlockLog | AlarmLog;

export interface TempPassword {
  id: number;
  name?: string;
  phase: number | string;
  effective_time: number;
  invalid_time: number;
  phone?: string;
}

/* -------------------------------------------------------------------------- */
/*                                 Constants                                 */
/* -------------------------------------------------------------------------- */
const endTime = Date.now();
const startTime = endTime - 7 * 24 * 60 * 60 * 1000;

/* -------------------------------------------------------------------------- */
/*                               Helper Row Components                         */
/* -------------------------------------------------------------------------- */
function UserRowMobile({
  user,
  deviceId,
  onRefresh,
}: {
  user: User;
  deviceId: string;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="border-b last:border-b-0 p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/50"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="bg-muted rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium">
            {user.nick_name[0] || "?"}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">
              {user.nick_name || "Unnamed"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.user_id}
            </p>
          </div>
        </div>
        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
          {user.role}
        </Badge>
      </div>

      <UserDetailDialog
        deviceId={deviceId}
        user={user}
        open={open}
        onOpenChange={setOpen}
        onDelete={onRefresh}
      />
    </>
  );
}

function UserRowDesktop({
  user,
  deviceId,
  onRefresh,
}: {
  user: User;
  deviceId: string;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => setOpen(true)}
      >
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="bg-muted rounded-full w-10 h-10 flex items-center justify-center text-xs">
              {user.nick_name[0] || "?"}
            </div>
            <div>
              <div className="font-medium">{user.nick_name || "Unnamed"}</div>
              <div className="text-sm text-muted-foreground">
                {user.user_id}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
            {user.role}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
          >
            Manage
          </Button>
        </TableCell>
      </TableRow>

      <UserDetailDialog
        deviceId={deviceId}
        user={user}
        open={open}
        onOpenChange={setOpen}
        onDelete={onRefresh}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */
export default function LockDetailClient({
  deviceId,
  initialDevice,
}: {
  deviceId: string;
  initialDevice: TuyaDevice;
}) {
  /* ------------------------------- UI State ------------------------------- */
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ nick_name: "", sex: "male" });
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [tempPassOpen, setTempPassOpen] = useState(false);
  const [selectedTempPass, setSelectedTempPass] = useState<TempPassword | null>(
    null
  );
  const [detailTempOpen, setDetailTempOpen] = useState(false);

  /* --------------------------------- SWR --------------------------------- */
  const { data: deviceData } = useSWR<{ result: TuyaDevice }>(
    `/api/devices/${deviceId}/details`,
    fetcher,
    { fallbackData: { result: initialDevice } }
  );

  const { data: statusData, mutate: mutateStatus } = useSWR<{
    result: DeviceStatus[];
  }>(`/api/devices/${deviceId}/status`, fetcher, { refreshInterval: 10000 });

  const { data: usersData, mutate: mutateUsers } = useSWR<{ result: User[] }>(
    `/api/devices/${deviceId}/users`,
    fetcher
  );

  const { data: tempPassData, mutate: mutateTempPass } = useSWR<{
    result: TempPassword[];
  }>(`/api/devices/${deviceId}/temp-passwords?valid=true`, fetcher);

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

  /* ----------------------------- Derived State ---------------------------- */
  const device = deviceData?.result || initialDevice;
  const statusMap = Object.fromEntries(
    statusData?.result?.map((s) => [s.code, s.value]) || []
  );
  const battery = statusMap.battery_percentage ?? statusMap.battery_state;
  const batteryLevel = typeof battery === "number" ? battery : null;
  const isLocked =
    statusMap.lock_state === "locked" || statusMap.door_state === "closed";

  /* ------------------------------- Handlers ------------------------------- */
  const handleRemoteUnlock = async () => {
    setUnlockLoading(true);
    try {
      await postApi(`/api/devices/${deviceId}/unlock`, {});
      toast.success("Door unlocked remotely!");
      mutateStatus();
    } catch {
      toast.error("Unlock failed");
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
    } catch {
      toast.error("Failed to add user");
    }
  };

  const openLogDetail = (log: Log) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  /*
  const handleClearAllTempPasswords = async () => {
    if (!confirm("Clear ALL temporary passwords?")) return;
    try {
      await postApi(
        `/api/devices/${deviceId}/temp-passwords/reset-password`,
        {}
      );
      toast.success("All temporary passwords cleared");
      mutateTempPass();
    } catch {
      toast.error("Clear failed");
    }
  };
  */

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                      */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="space-y-6 pb-8">
      {/* ------------------------------- Header ------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Lock className="h-7 w-7 sm:h-8 sm:w-8" />
            <span className="truncate">{device.name}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1 break-all">
            ID: {device.id}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <Badge
            variant={device.is_online ? "default" : "secondary"}
            className="w-fit text-sm px-3 py-1.5 flex items-center gap-1.5"
          >
            {device.is_online ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            <span className="hidden xs:inline">
              {device.is_online ? "Online" : "Offline"}
            </span>
          </Badge>
          <Button
            size="lg"
            onClick={handleRemoteUnlock}
            disabled={unlockLoading || !device.is_online}
            className="w-full sm:w-auto"
          >
            <Unlock className="h-5 w-5 mr-2" />
            {unlockLoading ? "Unlocking..." : "Remote Unlock"}
          </Button>
        </div>
      </div>

      {/* -------------------------------- Tabs -------------------------------- */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="temp-passwords">Temp Passwords</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* ----------------------------- Overview ----------------------------- */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
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
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Battery</CardTitle>
                {batteryLevel !== null && batteryLevel < 20 ? (
                  <BatteryLow className="h-5 w-5 text-destructive" />
                ) : (
                  <Battery className="h-5 w-5 text-green-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {batteryLevel !== null
                    ? `${batteryLevel}%`
                    : battery === "low"
                    ? "Low"
                    : "Normal"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
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

        {/* ------------------------------- Users ------------------------------- */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-lg">Lock Users</CardTitle>
                <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" /> Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
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
                          placeholder="Enter name"
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

            <CardContent className="p-0">
              {/* Mobile */}
              <div className="block sm:hidden">
                {usersData?.result?.map((user) => (
                  <UserRowMobile
                    key={user.user_id}
                    user={user}
                    deviceId={deviceId}
                    onRefresh={mutateUsers}
                  />
                ))}
              </div>

              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
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
                      <UserRowDesktop
                        key={user.user_id}
                        user={user}
                        deviceId={deviceId}
                        onRefresh={mutateUsers}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------------------------- Temporary Passwords -------------------------- */}
        <TabsContent value="temp-passwords">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-lg">Temporary Passwords</CardTitle>
                <div className="flex gap-2">
                  {/* <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearAllTempPasswords}
                  >
                    Clear All
                  </Button> */}

                  <Dialog open={tempPassOpen} onOpenChange={setTempPassOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" /> Add Temp Password
                      </Button>
                    </DialogTrigger>

                    <TempPasswordDialog
                      deviceId={deviceId}
                      onSuccess={() => {
                        setTempPassOpen(false);
                        mutateTempPass();
                        toast.success("Temp password created");
                      }}
                    />
                  </Dialog>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Mobile */}
              <div className="block sm:hidden">
                {tempPassData?.result?.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No temporary passwords
                  </div>
                ) : (
                  tempPassData?.result?.map((p) => (
                    <TempPasswordRow
                      key={p.id}
                      password={p}
                      onClick={() => {
                        setSelectedTempPass(p);
                        setDetailTempOpen(true);
                      }}
                    />
                  ))
                )}
              </div>

              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valid Period</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tempPassData?.result?.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground py-8"
                        >
                          No temporary passwords
                        </TableCell>
                      </TableRow>
                    ) : (
                      tempPassData?.result?.map((p) => (
                        <TableRow
                          key={p.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            setSelectedTempPass(p);
                            setDetailTempOpen(true);
                          }}
                        >
                          <TableCell>{p.name || "Unnamed"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                p.phase === 2
                                  ? "default"
                                  : p.phase === 3
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {phaseMap[p.phase] || p.phase}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(p.effective_time * 1000, "PP p")} –{" "}
                            {format(p.invalid_time * 1000, "PP p")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTempPass(p);
                                setDetailTempOpen(true);
                              }}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------------------------------- Logs -------------------------------- */}
        <TabsContent value="logs">
          <Tabs defaultValue="unlock">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="unlock">Unlock Logs</TabsTrigger>
              <TabsTrigger value="alarm">Alarms</TabsTrigger>
            </TabsList>

            <TabsContent value="unlock">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Unlock History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Mobile */}
                  <div className="block sm:hidden">
                    {unlockLogs?.result?.logs?.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No unlock events in last 7 days
                      </div>
                    ) : (
                      unlockLogs?.result?.logs?.map((log) => {
                        const hasMedia = !!log.media_infos?.length;
                        const isAlarm = hasMedia;
                        return (
                          <div
                            key={log.update_time}
                            onClick={() => openLogDetail(log)}
                            className="border-b last:border-b-0 p-4 hover:bg-muted/50 cursor-pointer"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">
                                  {log.nick_name || `ID: ${log.user_id}`}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(log.update_time, "MMM d, h:mm a")}
                                </p>
                              </div>
                              <Badge
                                variant={isAlarm ? "destructive" : "outline"}
                                className="text-xs"
                              >
                                {eventMap[log.status.code] || log.status.code}
                                {hasMedia && " (Media)"}
                              </Badge>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Desktop */}
                  <div className="hidden sm:block overflow-x-auto">
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
                          unlockLogs?.result?.logs?.map((log) => {
                            const hasMedia = !!log.media_infos?.length;
                            const isAlarm = hasMedia;
                            return (
                              <TableRow
                                key={log.update_time}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => openLogDetail(log)}
                              >
                                <TableCell>
                                  {format(log.update_time, "MMM d, h:mm a")}
                                </TableCell>
                                <TableCell>
                                  {log.nick_name || `ID: ${log.user_id}`}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      isAlarm ? "destructive" : "outline"
                                    }
                                  >
                                    {eventMap[log.status.code] ||
                                      log.status.code}
                                    {hasMedia && " (Photo/Video)"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alarm">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Alarm Events</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Mobile */}
                  <div className="block sm:hidden">
                    {alarmLogs?.result?.logs?.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No alarms in last 7 days
                      </div>
                    ) : (
                      alarmLogs?.result?.logs?.map((log) => {
                        const statusArray = Array.isArray(log.status)
                          ? log.status
                          : [log.status];
                        const primaryCode = statusArray[0].code;
                        const hasMedia = !!log.media_infos?.length;

                        return (
                          <div
                            key={log.update_time}
                            onClick={() => openLogDetail(log)}
                            className="border-b last:border-b-0 p-4 hover:bg-muted/50 cursor-pointer"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm text-destructive flex items-center gap-2">
                                  <BellRing className="h-4 w-4" />
                                  {eventMap[primaryCode] || primaryCode}
                                  {hasMedia && " (Media)"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(log.update_time, "MMM d, h:mm a")}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Desktop */}
                  <div className="hidden sm:block overflow-x-auto">
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
                                className="cursor-pointer hover:bg-muted/50"
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* ------------------------------- Dialogs ------------------------------- */}
      {selectedLog && (
        <LogDetailDialog
          log={selectedLog}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          deviceId={deviceId}
        />
      )}

      <Dialog open={detailTempOpen} onOpenChange={setDetailTempOpen}>
        {selectedTempPass && (
          <TempPasswordDetailDialog
            deviceId={deviceId}
            password={selectedTempPass}
            open={detailTempOpen}
            onOpenChange={setDetailTempOpen}
            onSuccess={mutateTempPass}
          />
        )}
      </Dialog>
    </div>
  );
}
