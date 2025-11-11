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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isAlarm ? (
              <BellRing className="h-6 w-6 text-destructive" />
            ) : (
              <ImageIcon className="h-6 w-6 text-primary" />
            )}
            {isAlarm ? "Alarm Event" : "Unlock Event"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">
                  {log.nick_name || "Unknown User"}
                </p>
                <p className="text-sm text-muted-foreground">
                  ID: {log.user_id || "N/A"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(log.update_time, "MMM d, yyyy")}
              </p>
              <p className="text-lg font-medium">
                {format(log.update_time, "h:mm:ss a")}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Event Details
            </h4>
            {statusArray.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-muted/50 rounded-lg p-4"
              >
                <div>
                  <Badge variant={isAlarm ? "destructive" : "default"}>
                    {eventMap[s.code] || s.code}
                  </Badge>
                  {s.value !== true && s.value !== false && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Value: {String(s.value)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {mediaInfo && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                {signedUrl?.includes(".mp4") ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <ImageIcon className="h-5 w-5" />
                )}
                Evidence
              </h4>
              <div className="relative rounded-xl overflow-hidden bg-black">
                {mediaLoading ? (
                  <Skeleton className="w-full h-96" />
                ) : signedUrl ? (
                  signedUrl.includes(".mp4") ? (
                    <video
                      controls
                      className="w-full h-96 object-contain"
                      poster={signedUrl.replace(".mp4", ".jpg")}
                    >
                      <source src={signedUrl} type="video/mp4" />
                      Your browser does not support video.
                    </video>
                  ) : (
                    <Image
                      src={signedUrl}
                      alt="Event capture"
                      width={800}
                      height={600}
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  )
                ) : (
                  <div className="h-96 flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Media expired or unavailable
                    </p>
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>File Key: {mediaInfo.file_key}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
