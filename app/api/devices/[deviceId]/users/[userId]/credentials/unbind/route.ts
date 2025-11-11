// src/app/api/devices/[deviceId]/users/[userId]/credentials/unbind/route.ts

import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

export async function POST(
  request: Request,
  context: { params: Promise<{ deviceId: string; userId: string }> }
) {
  const { deviceId, userId } = await context.params;

  try {
    const body = await request.json();
    const { unlock_list } = body;

    if (
      !unlock_list ||
      !Array.isArray(unlock_list) ||
      unlock_list.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Request body must contain a non-empty 'unlock_list' array.",
        },
        { status: 400 }
      );
    }

    const tuyaPayload = { user_id: userId, unlock_list: unlock_list };

    const response = await tuyaClient.request({
      method: "POST",
      path: `/v1.0/smart-lock/devices/${deviceId}/opmodes/actions/cancel-allocate`,
      body: tuyaPayload,
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
