import { notFound } from "next/navigation";
import LockDetailClient from "./LockDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface DeviceStatus {
  code: string;
  value: string | number | boolean;
}

interface TuyaDevice {
  id: string;
  name: string;
  is_online: boolean;
  status?: DeviceStatus[];
  icon_url?: string;
}

export default async function LockDetailPage({
  params,
}: {
  params: Promise<{ deviceId: string }>;
}) {
  const { deviceId } = await params;

  const deviceRes = await fetch(`/api/devices/${deviceId}/details`, {
    cache: "no-store",
  });

  if (!deviceRes.ok) notFound();

  const deviceData = await deviceRes.json();
  if (!deviceData.success || !deviceData.result) notFound();

  const device: TuyaDevice = deviceData.result;

  return <LockDetailClient deviceId={deviceId} initialDevice={device} />;
}
