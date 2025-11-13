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
    const { unlock_sn, unlock_type } = body; // Client sends unlock_sn (int) + type

    if (!unlock_sn || !unlock_type) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: unlock_sn (int), unlock_type",
        },
        { status: 400 }
      );
    }

    // Map type to dp_code
    const dpCodeMap: Record<string, string> = {
      fingerprint: "unlock_fingerprint",
      password: "unlock_password",
      card: "unlock_card",
      face: "unlock_face", // If supported
    };
    const dp_code = dpCodeMap[unlock_type];
    if (!dp_code) {
      return NextResponse.json(
        { success: false, message: "Invalid unlock_type" },
        { status: 400 }
      );
    }

    const response = await tuyaClient.request({
      method: "POST",
      path: `/v1.0/devices/${deviceId}/door-lock/opmodes/actions/allocate`,
      body: {
        user_id: userId,
        unlock_list: [{ dp_code, unlock_sn }],
      },
    });

    const { result, success, msg } = response.data;
    if (!success) {
      return NextResponse.json(
        { success: false, message: msg || "Tuya API error" },
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
