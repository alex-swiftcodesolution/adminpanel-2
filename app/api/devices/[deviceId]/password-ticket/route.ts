import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

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

    if (!success || !result) {
      return NextResponse.json(
        { success: false, message: msg ?? "Failed to get ticket" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
