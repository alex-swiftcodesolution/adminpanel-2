// src/app/api/devices/[deviceId]/users/[userId]/schedule/route.ts

import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

export async function PUT(
  request: Request,
  context: { params: Promise<{ deviceId: string; userId: string }> }
) {
  const { deviceId, userId } = await context.params;

  try {
    const body = await request.json();

    const response = await tuyaClient.request({
      method: "PUT",
      path: `/v1.0/smart-lock/devices/${deviceId}/users/${userId}/schedule`,
      body: body,
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
