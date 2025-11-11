// src/app/api/devices/[deviceId]/details/route.ts

import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

// This endpoint gets rich, static details for a single specified device.
export async function GET(
  request: Request,
  context: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await context.params;

  if (!deviceId) {
    return NextResponse.json(
      { success: false, message: "Device ID is required." },
      { status: 400 }
    );
  }

  try {
    // Using the new v2.0 endpoint for detailed device information
    const response = await tuyaClient.request({
      method: "GET",
      path: `/v2.0/cloud/thing/${deviceId}`,
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
