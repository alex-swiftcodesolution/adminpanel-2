/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const body = await request.json();

  const required = [
    "name",
    "password",
    "effective_time",
    "invalid_time",
    "password_type",
    "ticket_id",
    "relate_dev_list",
  ];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json(
        { success: false, message: `Missing ${field}` },
        { status: 400 }
      );
    }
  }

  try {
    const res = await tuyaClient.request({
      method: "POST",
      path: `/v1.0/devices/${deviceId}/door-lock/temp-password`,
      body,
    });

    const { success, result, msg } = res.data as any;
    if (!success) {
      return NextResponse.json(
        { success: false, message: msg ?? "Tuya error" },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: true, result }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
