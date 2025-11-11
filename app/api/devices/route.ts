// src/app/api/devices/route.ts

import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

// This endpoint gets all devices associated with your project's user account.
export async function GET() {
  const uid = process.env.TUYA_APP_ACCOUNT_UID;

  if (!uid) {
    return NextResponse.json(
      {
        success: false,
        message: "TUYA_APP_ACCOUNT_UID is not set in .env.local",
      },
      { status: 500 }
    );
  }

  try {
    // CORRECTED: Using the standard v1.0 path to list devices by user UID.
    const response = await tuyaClient.request({
      method: "GET",
      path: `/v1.0/users/${uid}/devices`,
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
