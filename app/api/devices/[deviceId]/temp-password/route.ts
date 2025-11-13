/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const body = await request.json();

  // Required fields for template temp password
  const required = [
    "name",
    "password",
    "effective_time",
    "invalid_time",
    "password_type",
    "ticket_id",
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
      path: `/v1.0/smart-lock/device/${deviceId}/template/temp-password`,
      body: {
        name: body.name,
        password: body.password,
        password_type: body.password_type,
        ticket_id: body.ticket_id,
        effective_time: body.effective_time,
        invalid_time: body.invalid_time,
        type: body.type ?? 0,
        phone: body.phone,
        check_name: body.check_name ?? true,
        is_record: body.is_record ?? true,
        // Optional fields
        ...(body.time_zone && { time_zone: body.time_zone }),
        ...(body.schedule_list && { schedule_list: body.schedule_list }),
        ...(body.bluetooth_symbolic !== undefined && {
          bluetooth_symbolic: body.bluetooth_symbolic,
        }),
      },
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
