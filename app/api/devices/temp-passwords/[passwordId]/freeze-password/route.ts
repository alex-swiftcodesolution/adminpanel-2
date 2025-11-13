/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/devices/[deviceId]/temp-passwords/[passwordId]/freeze-password/route.ts
import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ deviceId: string; passwordId: string }> }
) {
  const { deviceId, passwordId } = await params;

  try {
    const response = await tuyaClient.request({
      method: "PUT",
      path: `/v1.0/devices/${deviceId}/door-lock/temp-passwords/${passwordId}/freeze-password`,
    });

    const { result, success, msg } = response.data as any;
    if (!success) {
      return NextResponse.json(
        { success: false, message: msg },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
