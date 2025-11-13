// app/api/devices/[deviceId]/password-ticket/route.ts
import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";
import { decryptTicketKey } from "@/lib/crypto";
import { TUYA_ACCESS_KEY } from "@/lib/constants";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;

  try {
    const res = await tuyaClient.request({
      method: "POST",
      path: `/v1.0/devices/${deviceId}/door-lock/password-ticket`,
    });

    const { success, result, msg } = res.data as {
      success: boolean;
      result?: { ticket_id: string; ticket_key: string; expire_time: number };
      msg?: string;
    };

    if (!success || !result?.ticket_key) {
      return NextResponse.json(
        { success: false, message: msg ?? "No ticket_key" },
        { status: 502 }
      );
    }

    // Decrypt on server
    const plainTicketKey = decryptTicketKey(result.ticket_key, TUYA_ACCESS_KEY);

    return NextResponse.json({
      success: true,
      result: { ticket_id: result.ticket_id, plainTicketKey },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Decrypt failed",
      },
      { status: 500 }
    );
  }
}
