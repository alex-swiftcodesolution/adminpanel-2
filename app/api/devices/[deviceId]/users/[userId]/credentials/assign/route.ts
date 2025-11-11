// src/app/api/devices/[deviceId]/users/[userId]/credentials/assign/route.ts

import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

export async function POST(
  request: Request,
  context: { params: Promise<{ deviceId: string; userId: string }> }
) {
  const { deviceId, userId } = await context.params;

  try {
    const body = await request.json();
    const { no, type } = body;

    if (!no || !type) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: no, type" },
        { status: 400 }
      );
    }

    const response = await tuyaClient.request({
      method: "POST",
      path: `/v1.0/devices/${deviceId}/device-lock/users/${userId}/allocate`,
      body: { no, type },
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
