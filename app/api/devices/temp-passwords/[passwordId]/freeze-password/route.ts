// src/app/api/devices/[deviceId]/temp-passwords/[passwordId]/freeze-password/route.ts
import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

// Correct typing for Next.js 16 App Router
export async function PUT(
  request: Request,
  context: { params: { deviceId: string; passwordId: string } }
) {
  const { deviceId, passwordId } = context.params;

  try {
    const response = await tuyaClient.request({
      method: "PUT",
      path: `/v1.0/devices/${deviceId}/door-lock/temp-passwords/${passwordId}/freeze-password`,
    });

    const { result, success, msg } = response.data;

    if (!success) {
      return NextResponse.json(
        { success: false, message: msg },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
