/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/devices/[deviceId]/credentials/unassigned/route.ts
import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

export async function GET(
  request: Request,
  context: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await context.params;
  const { searchParams } = new URL(request.url);
  const unlock_type = searchParams.get("unlock_type");

  try {
    let path = `/v1.0/devices/${deviceId}/door-lock/unassigned-keys`;
    if (unlock_type) {
      path += `?unlock_type=${encodeURIComponent(unlock_type)}`;
    }

    const response = await tuyaClient.request({
      method: "GET",
      path,
    });

    const { result, success, msg } = response.data;

    if (!success) {
      return NextResponse.json(
        { success: false, message: msg || "No unassigned keys" },
        { status: 502 }
      );
    }

    // Runtime guard – exactly the same pattern used in the reference file
    const unlock_keys =
      result &&
      typeof result === "object" &&
      "unlock_keys" in result &&
      Array.isArray((result as any).unlock_keys)
        ? (result as any).unlock_keys
        : [];

    return NextResponse.json({
      success: true,
      result: unlock_keys,
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
