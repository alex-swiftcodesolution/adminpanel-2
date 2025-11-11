// src/app/dashboard/page.tsx
"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BatteryWarning, Lock, Wifi, KeyRound } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { eventMap } from "@/lib/utils";
import useSWR from "swr";
import { fetcher } from "@/lib/api-client";

// --- NEW: Define types for our API data to eliminate 'any' ---
interface DeviceStatus {
  code: string;
  value: string | number | boolean;
}

interface TuyaDevice {
  id: string;
  name: string;
  online: boolean;
  status?: DeviceStatus[];
}

interface UnlockLog {
  update_time: number;
  user_id: string;
  nick_name?: string;
  avatar?: string;
  status: DeviceStatus;
}
// --- END OF NEW TYPES ---

// Animation variants
const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

// --- CORRECTED: Define timestamps as module-level constants ---
// This ensures they are calculated only once when the module is loaded, satisfying the purity rule.
const endTime = Date.now();
const startTime = endTime - 7 * 24 * 60 * 60 * 1000; // 7 days ago
// --- END OF CORRECTION ---

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const {
    data: devicesData,
    error: devicesError,
    isLoading: devicesLoading,
  } = useSWR<{ result: TuyaDevice[] }>("/api/devices", fetcher);

  const firstDeviceId = devicesData?.result?.[0]?.id;

  const logsSWRKey = firstDeviceId
    ? `/api/devices/${firstDeviceId}/logs/unlock?page_no=1&page_size=5&start_time=${startTime}&end_time=${endTime}`
    : null;

  const {
    data: logsData,
    error: logsError,
    isLoading: logsLoading,
  } = useSWR<{ result: { logs: UnlockLog[] } }>(logsSWRKey, fetcher);

  if (devicesLoading || (firstDeviceId && logsLoading)) {
    return <DashboardSkeleton />;
  }

  if (devicesError) {
    return (
      <div className="text-center text-destructive">
        Failed to load device data. Please refresh.
      </div>
    );
  }
  if (logsError) {
    console.error("Failed to load activity logs:", logsError);
  }

  const devices = devicesData?.result || [];
  const totalLocks = devices.length;
  const onlineLocks = devices.filter((d) => d.online).length;
  const lowBatteryLocks = devices.filter((d) =>
    d.status?.some((s) => s.code === "battery_state" && s.value === "low")
  ).length;
  const recentEvents = logsData?.result?.logs || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Locks</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLocks}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Online</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {onlineLocks}/{totalLocks}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Low Battery</CardTitle>
              <BatteryWarning className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  lowBatteryLocks > 0 ? "text-destructive" : ""
                }`}
              >
                {lowBatteryLocks}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEvents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center h-24 text-muted-foreground"
                  >
                    {logsLoading
                      ? "Loading activity..."
                      : "No recent activity to display."}
                  </TableCell>
                </TableRow>
              ) : (
                recentEvents.map((e) => {
                  const friendlyEventName =
                    eventMap[e.status.code] || e.status.code.replace(/_/g, " ");
                  return (
                    <TableRow key={e.update_time}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Image
                            src={e.avatar || "/fallback-avatar.png"}
                            alt={e.nick_name || "System"}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                          <span>{e.nick_name || `User ID: ${e.user_id}`}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <KeyRound className="h-4 w-4 text-muted-foreground" />
                          <span>{friendlyEventName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(e.update_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
