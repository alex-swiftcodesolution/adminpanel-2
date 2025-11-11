// src/app/api/devices/[deviceId]/users/[userId]/credentials/route.ts

import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

export async function GET(
  request: Request,
  context: { params: Promise<{ deviceId: string; userId: string }> }
) {
  const { deviceId, userId } = await context.params;
  const { searchParams } = new URL(request.url);

  try {
    const response = await tuyaClient.request({
      method: "GET",
      path: `/v1.0/smart-lock/devices/${deviceId}/opmodes/${userId}`,
      query: Object.fromEntries(searchParams.entries()),
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
