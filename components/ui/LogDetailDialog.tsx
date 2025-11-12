"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  BellRing,
  User,
  Clock,
  AlertTriangle,
  Image as ImageIcon,
  Video,
  X,
} from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/api-client";
import { eventMap } from "@/lib/utils";
import Image from "next/image";

interface MediaInfo {
  file_key: string;
  file_url: string;
}

interface DeviceStatus {
  code: string;
  value: string | number | boolean;
}

interface LogDetail {
  update_time: number;
  nick_name?: string;
  user_id?: string;
  status: DeviceStatus | DeviceStatus[];
  media_infos?: MediaInfo[];
}

interface LogDetailDialogProps {
  log: LogDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId: string;
}

export default function LogDetailDialog({
  log,
  open,
  onOpenChange,
  deviceId,
}: LogDetailDialogProps) {
  const isAlarm = "media_infos" in log || Array.isArray(log.status);
  const statusArray = Array.isArray(log.status) ? log.status : [log.status];
  const mediaInfo = log.media_infos?.[0];

  const { data: mediaUrlData, isLoading: mediaLoading } = useSWR<{
    success: boolean;
    result: { file_url: string };
  }>(
    mediaInfo?.file_key
      ? `/api/devices/${deviceId}/media?url=${encodeURIComponent(
          mediaInfo.file_url
        )}&key=${mediaInfo.file_key}`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const signedUrl = mediaUrlData?.success
    ? mediaUrlData.result.file_url
    : mediaInfo?.file_url;

  const isVideo = signedUrl?.includes(".mp4");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-[95vw] sm:max-w-2xl max-h-[95vh] rounded-xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl">
              {isAlarm ? (
                <BellRing className="h-7 w-7 text-destructive" />
              ) : (
                <ImageIcon className="h-7 w-7 text-primary" />
              )}
              <span>{isAlarm ? "Alarm Event" : "Unlock Event"}</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto px-6 pb-6 space-y-6">
          {/* User & Time */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-muted rounded-full w-14 h-14 flex items-center justify-center shrink-0">
                <User className="h-7 w-7" />
              </div>
              <div>
                <p className="font-bold text-lg">
                  {log.nick_name || "Unknown User"}
                </p>
                <p className="text-sm text-muted-foreground">
                  ID: {log.user_id || "N/A"}
                </p>
              </div>
            </div>
            <div className="text-right sm:text-left">
              <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end sm:justify-start">
                <Clock className="h-4 w-4" />
                {format(log.update_time, "MMM d, yyyy")}
              </p>
              <p className="text-2xl font-bold">
                {format(log.update_time, "h:mm:ss a")}
              </p>
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Event Details
            </h4>
            <div className="grid gap-3">
              {statusArray.map((s, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted/60 rounded-xl p-4 border"
                >
                  <div>
                    <Badge
                      variant={isAlarm ? "destructive" : "default"}
                      className="text-sm"
                    >
                      {eventMap[s.code] || s.code}
                    </Badge>
                    {s.value !== true && s.value !== false && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <span className="font-medium">Value:</span>{" "}
                        {String(s.value)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Media */}
          {mediaInfo && (
            <div className="space-y-3">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                {isVideo ? (
                  <Video className="h-5 w-5 text-blue-600" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-green-600" />
                )}
                Evidence
              </h4>
              <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-muted">
                {mediaLoading ? (
                  <div className="aspect-video flex items-center justify-center">
                    <Skeleton className="w-full h-full" />
                  </div>
                ) : signedUrl ? (
                  isVideo ? (
                    <video
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full aspect-video object-contain"
                    >
                      <source src={signedUrl} type="video/mp4" />
                      Video not supported
                    </video>
                  ) : (
                    <Image
                      src={signedUrl}
                      alt="Event capture"
                      width={800}
                      height={600}
                      className="w-full h-auto max-h-[70vh] object-contain"
                    />
                  )
                ) : (
                  <div className="aspect-video flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12" />
                    <p>Media expired or unavailable</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono break-all">
                {mediaInfo.file_key}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button size="lg" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
