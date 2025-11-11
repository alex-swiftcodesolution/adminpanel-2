// src/app/api/devices/[deviceId]/users/[userId]/actions/role/route.ts

import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

export async function PUT(
  request: Request,
  context: { params: Promise<{ deviceId: string; userId: string }> }
) {
  const { deviceId, userId } = await context.params;

  try {
    const body = await request.json();
    const { role } = body;

    if (!role || !["admin", "normal"].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid role. Must be 'admin' or 'normal'.",
        },
        { status: 400 }
      );
    }

    const response = await tuyaClient.request({
      method: "PUT",
      path: `/v1.0/smart-lock/devices/${deviceId}/users/${userId}/actions/role`,
      body: { role },
    });

    const { success, msg } = response.data;
    if (!success) {
      return NextResponse.json(
        { success: false, message: msg },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}.`,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
