// src/app/api/devices/[deviceId]/logs/unlock/route.ts
import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

export async function GET(
  request: Request,
  context: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await context.params;
  const { searchParams } = new URL(request.url);

  // Tuya REQUIRES start_time & end_time → auto-fill if missing
  if (!searchParams.has("start_time") || !searchParams.has("end_time")) {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 604800000;
    searchParams.set("start_time", sevenDaysAgo.toString());
    searchParams.set("end_time", now.toString());
  }

  if (!searchParams.has("page_no")) searchParams.set("page_no", "1");
  if (!searchParams.has("page_size")) searchParams.set("page_size", "20");

  try {
    const response = await tuyaClient.request({
      method: "GET",
      path: `/v1.0/devices/${deviceId}/door-lock/open-logs`,
      query: Object.fromEntries(searchParams.entries()),
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
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
