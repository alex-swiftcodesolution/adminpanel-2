// src/app/dashboard/locks/[deviceId]/page.tsx
import { notFound } from "next/navigation";
import LockDetailClient from "./LockDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Device {
  id: string;
  name: string;
  online: boolean;
  status?: { code: string; value: any }[];
}

export default async function LockDetailPage({
  params,
}: {
  params: Promise<{ deviceId: string }>;
}) {
  const { deviceId } = await params; // ← CRITICAL: await the Promise

  // Server-side fetch with error handling
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const deviceRes = await fetch(`${baseUrl}/api/devices/${deviceId}/details`, {
    cache: "no-store",
  });

  if (!deviceRes.ok) {
    notFound();
  }

  const deviceData = await deviceRes.json();
  if (!deviceData.success || !deviceData.result) {
    notFound();
  }

  return (
    <LockDetailClient deviceId={deviceId} initialDevice={deviceData.result} />
  );
}
