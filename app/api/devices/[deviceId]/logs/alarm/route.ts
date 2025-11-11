// src/app/api/devices/[deviceId]/logs/alarm/route.ts
import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

interface AlarmRecord {
  media_infos?: Array<{ file_key: string; file_url: string }>;
  nick_name: string;
  status: Array<{ code: string; value: string }>;
  update_time: number;
}

interface TuyaAlarmResult {
  records: AlarmRecord[];
  total: number;
}

interface TuyaAlarmResponse {
  result: TuyaAlarmResult;
  success: boolean;
  msg?: string;
  code?: number;
}

const VALID_ALARM_CODES =
  "alarm_lock,alarm_battery_low,alarm_tamper,alarm_duress,alarm_break_in,alarm_vibration,alarm_door_open";

export async function GET(
  request: Request,
  context: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await context.params;
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  searchParams.set("codes", VALID_ALARM_CODES);
  searchParams.set("show_media_info", "true");
  searchParams.set("page_no", "1");
  searchParams.set("page_size", "10");

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  searchParams.set("start_time", sevenDaysAgo.toString());
  searchParams.set("end_time", now.toString());

  try {
    const response = await tuyaClient.request<TuyaAlarmResponse>({
      method: "GET",
      path: `/v1.1/devices/${deviceId}/door-lock/alarm-logs`,
      query: Object.fromEntries(searchParams.entries()),
    });

    const { result, success, msg } = response.data;

    if (!success) {
      return NextResponse.json(
        { success: false, message: msg || "Tuya API error" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      result: {
        logs: result.records || [],
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown network error";
    console.error("Alarm logs failed:", message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
