// src/app/api/devices/[deviceId]/logs/unlock/route.ts
import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

export async function GET(
  request: Request,
  context: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await context.params;
  const { searchParams } = new URL(request.url);

  // Ensure Tuya-required query params
  if (!searchParams.has("start_time") || !searchParams.has("end_time")) {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    searchParams.set("start_time", sevenDaysAgo.toString());
    searchParams.set("end_time", now.toString());
  }

  if (!searchParams.has("page_no")) searchParams.set("page_no", "1");
  if (!searchParams.has("page_size")) searchParams.set("page_size", "20");
  if (!searchParams.has("show_media_info"))
    searchParams.set("show_media_info", "true");

  try {
    const response = await tuyaClient.request({
      method: "GET",
      path: `/v1.1/devices/${deviceId}/door-lock/open-logs`,
      query: Object.fromEntries(searchParams.entries()),
    });

    const { result, success, msg, t, tid } = response.data as any;

    // Match Tuya response structure exactly
    if (!success) {
      return NextResponse.json(
        {
          success: false,
          message: msg || "Tuya request failed",
          t: t || Date.now(),
          tid: tid || crypto.randomUUID(),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      result,
      success,
      t: t || Date.now(),
      tid: tid || crypto.randomUUID(),
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        t: Date.now(),
        tid: crypto.randomUUID(),
      },
      { status: 500 }
    );
  }
}
