import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

type RouteContext = {
  params: Promise<{ deviceId: string; passwordId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const { deviceId, passwordId } = await context.params;
  try {
    const body = await request.json();
    const {
      name,
      password,
      effective_time,
      invalid_time,
      password_type,
      ticket_id,
    } = body;

    if (
      !name ||
      !password ||
      !effective_time ||
      !invalid_time ||
      !password_type ||
      !ticket_id
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await tuyaClient.request({
      method: "PUT",
      path: `/v1.0/devices/${deviceId}/door-lock/temp-passwords/${passwordId}/modify-password`,
      body,
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
