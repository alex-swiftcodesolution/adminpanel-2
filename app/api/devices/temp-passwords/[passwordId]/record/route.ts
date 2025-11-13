// src/app/api/devices/[deviceId]/temp-passwords/[passwordId]/record/route.ts
import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

type RouteContext = {
  params: Promise<{ deviceId: string; passwordId: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const { deviceId, passwordId } = await context.params;
  try {
    const response = await tuyaClient.request({
      method: "DELETE",
      path: `/v1.0/devices/${deviceId}/door-lock/temp-passwords/${passwordId}/record`,
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
