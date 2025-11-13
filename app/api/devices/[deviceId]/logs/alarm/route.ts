import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

type AlarmStatusItem = { code: string; value: unknown };

interface AlarmRecord {
  media_infos?: { file_key: string; file_url: string }[];
  nick_name?: string;
  status: AlarmStatusItem[];
  update_time: number; // Unix timestamp in milliseconds
}

interface TuyaAlarmResult {
  records: AlarmRecord[];
  total: number;
}

interface TuyaResponse<T> {
  result: T;
  success: boolean;
  msg?: string;
  code?: number;
}

const DEFAULT_ALARM_CODES = "alarm_lock,hijack,doorbell";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const query = {
    page_no: searchParams.get("page_no") ?? "1",
    page_size: searchParams.get("page_size") ?? "10",
    codes: searchParams.get("codes") ?? DEFAULT_ALARM_CODES,
    show_media_info: searchParams.get("show_media_info") ?? "true",
  };

  try {
    const response = await tuyaClient.request<TuyaAlarmResult>({
      method: "GET",
      path: `/v1.1/devices/${deviceId}/door-lock/alarm-logs`,
      query,
    });

    const data = response.data as TuyaResponse<TuyaAlarmResult>;
    const { result, success, msg } = data;

    if (!success) {
      console.error("Tuya alarm-logs error:", data);
      return NextResponse.json(
        { success: false, message: msg || "Tuya API error" },
        { status: 502 }
      );
    }

    const logs = (result.records ?? []).map((r) => ({
      ...r,
      status: Array.isArray(r.status) ? r.status : [r.status],
    }));

    return NextResponse.json({
      success: true,
      result: {
        logs,
        total: result.total ?? 0,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown network error";
    console.error("Alarm logs failed:", message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
