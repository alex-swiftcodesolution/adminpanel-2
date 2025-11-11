// src/app/api/devices/[deviceId]/status/route.ts

import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

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
    const response = await tuyaClient.request({
      method: "GET",
      path: `/v1.0/iot-03/devices/${deviceId}/status`,
    });

    const { result, success, msg } = response.data;

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          message: msg || "Failed to get device status from Tuya.",
        },
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
