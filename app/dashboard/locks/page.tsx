// src/app/dashboard/locks/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wifi,
  WifiOff,
  Lock,
  AlertCircle,
  Battery,
  BatteryLow,
} from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/api-client";

interface DeviceStatus {
  code: string;
  value: string | number | boolean;
}

interface TuyaDevice {
  id: string;
  name: string;
  online: boolean;
  status?: DeviceStatus[];
  icon_url?: string;
}

interface ApiResponse {
  result: TuyaDevice[];
  success: boolean;
}

function LocksSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {["Lock", "Status", "Battery", "Actions"].map((h) => (
                    <TableHead key={h}>
                      <Skeleton className="h-5 w-20" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-8 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-9 w-24" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LocksPage() {
  const { data, error, isLoading } = useSWR<ApiResponse>(
    "/api/devices",
    fetcher
  );

  if (isLoading) return <LocksSkeleton />;
  if (error || !data?.success) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg text-muted-foreground text-center px-4">
          Failed to load locks. Please try again.
        </p>
      </div>
    );
  }

  const devices = data.result || [];

  if (devices.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center px-6">
          <Lock className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No locks found</h3>
          <p className="text-muted-foreground max-w-md text-sm">
            Your Tuya project has no registered smart locks yet. Add devices in
            the Tuya IoT Console.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">All Locks</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage and monitor all smart locks
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-base px-4 py-2 self-start sm:self-auto"
        >
          {devices.length} {devices.length === 1 ? "Lock" : "Locks"}
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Smart Locks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            {devices.map((device) => {
              const battery = device.status?.find(
                (s) =>
                  s.code === "battery_percentage" || s.code === "battery_state"
              );
              const batteryLevel =
                battery?.code === "battery_percentage"
                  ? Number(battery.value)
                  : null;
              const isLow = battery?.value === "low";

              return (
                <div
                  key={device.id}
                  className="border-b last:border-b-0 p-4 hover:bg-muted/50 transition-colors"
                >
                  <Link
                    href={`/dashboard/locks/${device.id}`}
                    className="block"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        {device.icon_url ? (
                          <Image
                            src={device.icon_url}
                            alt={device.name}
                            width={48}
                            height={48}
                            className="rounded-lg object-contain"
                          />
                        ) : (
                          <div className="bg-muted border-2 border-dashed rounded-lg w-12 h-12 flex items-center justify-center">
                            <Lock className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {device.name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {device.id}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <Badge
                            variant={device.online ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {device.online ? (
                              <>
                                <Wifi className="h-3 w-3 mr-1" />
                                Online
                              </>
                            ) : (
                              <>
                                <WifiOff className="h-3 w-3 mr-1" />
                                Offline
                              </>
                            )}
                          </Badge>

                          {battery && (
                            <div className="flex items-center gap-1 text-sm">
                              {isLow ||
                              (batteryLevel !== null && batteryLevel < 20) ? (
                                <BatteryLow className="h-4 w-4 text-destructive" />
                              ) : (
                                <Battery className="h-4 w-4 text-green-600" />
                              )}
                              <span
                                className={
                                  isLow ||
                                  (batteryLevel !== null && batteryLevel < 20)
                                    ? "text-destructive font-medium"
                                    : ""
                                }
                              >
                                {batteryLevel !== null
                                  ? `${batteryLevel}%`
                                  : isLow
                                  ? "Low"
                                  : "Normal"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                  <Button size="sm" className="mt-4 w-full" asChild>
                    <Link href={`/dashboard/locks/${device.id}`}>Manage</Link>
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Battery</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => {
                  const battery = device.status?.find(
                    (s) =>
                      s.code === "battery_percentage" ||
                      s.code === "battery_state"
                  );
                  const batteryLevel =
                    battery?.code === "battery_percentage"
                      ? Number(battery.value)
                      : null;
                  const isLow = battery?.value === "low";

                  return (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/locks/${device.id}`}
                          className="flex items-center gap-3 hover:underline"
                        >
                          <div className="relative">
                            {device.icon_url ? (
                              <Image
                                src={device.icon_url}
                                alt={device.name}
                                width={40}
                                height={40}
                                className="rounded-lg object-contain"
                              />
                            ) : (
                              <div className="bg-muted border-2 border-dashed rounded-lg w-10 h-10 flex items-center justify-center">
                                <Lock className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{device.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {device.id}
                            </div>
                          </div>
                        </Link>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={device.online ? "default" : "secondary"}
                        >
                          {device.online ? (
                            <>
                              <Wifi className="h-3 w-3 mr-1" />
                              Online
                            </>
                          ) : (
                            <>
                              <WifiOff className="h-3 w-3 mr-1" />
                              Offline
                            </>
                          )}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {battery ? (
                          <div className="flex items-center gap-2">
                            {isLow ||
                            (batteryLevel !== null && batteryLevel < 20) ? (
                              <BatteryLow className="h-4 w-4 text-destructive" />
                            ) : (
                              <Battery className="h-4 w-4 text-green-600" />
                            )}
                            <span
                              className={
                                isLow ||
                                (batteryLevel !== null && batteryLevel < 20)
                                  ? "text-destructive font-medium"
                                  : ""
                              }
                            >
                              {batteryLevel !== null
                                ? `${batteryLevel}%`
                                : isLow
                                ? "Low"
                                : "Normal"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button size="sm" asChild>
                          <Link href={`/dashboard/locks/${device.id}`}>
                            Manage
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
