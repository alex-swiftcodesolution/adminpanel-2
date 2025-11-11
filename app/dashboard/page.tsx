// src/app/dashboard/page.tsx
"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  BatteryWarning,
  Lock,
  Wifi,
  KeyRound,
  ShieldAlert, // <-- Import new icon for alarms
} from "lucide-react";
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
import React from "react";

// --- UPDATED: Define types for API data ---
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

// NEW: Define type for Alarm Logs based on the v1.1 API
interface AlarmLog {
  update_time: number;
  nick_name?: string; // Often empty for alarms
  status: DeviceStatus[]; // Note: this is an array
}

// NEW: Define a unified structure for rendering
interface UnifiedEvent {
  id: string | number;
  timestamp: number;
  actor: string;
  avatar?: string;
  event: string;
  Icon: React.ElementType; // Use a dynamic icon component
}
// --- END OF TYPE DEFINITIONS ---

// Animation variants
const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

// Timestamps for unlock logs
const endTime = Date.now();
const startTime = endTime - 7 * 24 * 60 * 60 * 1000; // 7 days ago

function DashboardSkeleton() {
  // ... (skeleton component remains the same)
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

  // --- SWR HOOK FOR UNLOCK LOGS ---
  const unlockLogsSWRKey = firstDeviceId
    ? `/api/devices/${firstDeviceId}/logs/unlock?page_no=1&page_size=10&start_time=${startTime}&end_time=${endTime}`
    : null;

  const {
    data: unlockLogsData,
    error: unlockLogsError,
    isLoading: unlockLogsLoading,
  } = useSWR<{ result: { logs: UnlockLog[] } }>(unlockLogsSWRKey, fetcher);

  // --- NEW: SWR HOOK FOR ALARM LOGS ---
  const alarmLogsSWRKey = firstDeviceId
    ? `/api/devices/${firstDeviceId}/logs/alarm?page_no=1&page_size=10`
    : null;

  const {
    data: alarmLogsData,
    error: alarmLogsError,
    isLoading: alarmLogsLoading,
  } = useSWR<{ result: { logs: AlarmLog[] } }>(alarmLogsSWRKey, fetcher);

  // --- COMBINE, SORT, AND MEMOIZE EVENT DATA ---
  const recentEvents = useMemo(() => {
    const combinedEvents: UnifiedEvent[] = [];

    // Process unlock logs
    if (unlockLogsData?.result?.logs) {
      unlockLogsData.result.logs.forEach((log) => {
        combinedEvents.push({
          id: `unlock-${log.update_time}`,
          timestamp: log.update_time,
          actor: log.nick_name || `User ID: ${log.user_id}`,
          avatar: log.avatar,
          event:
            eventMap[log.status.code] || log.status.code.replace(/_/g, " "),
          Icon: KeyRound,
        });
      });
    }

    // Process alarm logs
    if (alarmLogsData?.result?.logs) {
      alarmLogsData.result.logs.forEach((log) => {
        const primaryStatus = log.status?.[0];
        if (primaryStatus) {
          combinedEvents.push({
            id: `alarm-${log.update_time}`,
            timestamp: log.update_time,
            actor: log.nick_name || "System Alert",
            event:
              eventMap[primaryStatus.code] ||
              primaryStatus.code.replace(/_/g, " "),
            Icon: ShieldAlert, // Use alarm icon
          });
        }
      });
    }

    // Sort by most recent and take the top 10
    return combinedEvents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }, [unlockLogsData, alarmLogsData]);

  // Update loading state to wait for both log types
  if (
    devicesLoading ||
    (firstDeviceId && (unlockLogsLoading || alarmLogsLoading))
  ) {
    return <DashboardSkeleton />;
  }

  if (devicesError) {
    return (
      <div className="text-center text-destructive">
        Failed to load device data. Please refresh.
      </div>
    );
  }

  // Log errors for debugging but don't block the UI
  if (unlockLogsError)
    console.error("Failed to load unlock logs:", unlockLogsError);
  if (alarmLogsError)
    console.error("Failed to load alarm logs:", alarmLogsError);

  const devices = devicesData?.result || [];
  const totalLocks = devices.length;
  const onlineLocks = devices.filter((d) => d.online).length;
  const lowBatteryLocks = devices.filter((d) =>
    d.status?.some((s) => s.code === "battery_state" && s.value === "low")
  ).length;

  const isLoadingEvents = unlockLogsLoading || alarmLogsLoading;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* --- STATS CARDS (Unchanged) --- */}
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
      {/* --- END OF STATS CARDS --- */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* --- UPDATED TABLE --- */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User / Source</TableHead>
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
                    {isLoadingEvents
                      ? "Loading activity..."
                      : "No recent activity to display."}
                  </TableCell>
                </TableRow>
              ) : (
                recentEvents.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {e.avatar ? (
                          <Image
                            src={e.avatar}
                            alt={e.actor}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          // A placeholder for events without avatars (like alarms)
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                            <e.Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <span>{e.actor}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <e.Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{e.event}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(e.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
