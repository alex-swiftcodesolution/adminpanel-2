// src/app/api/devices/[deviceId]/users/route.ts

import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

export async function GET(
  request: Request,
  context: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await context.params;
  try {
    const response = await tuyaClient.request({
      method: "GET",
      path: `/v1.0/devices/${deviceId}/users`,
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

export async function POST(
  request: Request,
  context: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await context.params;

  try {
    const body = await request.json();
    const { nick_name, sex } = body;

    if (!nick_name || !sex) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: nick_name, sex" },
        { status: 400 }
      );
    }

    const response = await tuyaClient.request({
      method: "POST",
      path: `/v1.0/devices/${deviceId}/user`,
      body: body,
    });

    const { result, success, msg } = response.data;
    if (!success) {
      return NextResponse.json(
        { success: false, message: msg },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, result }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
