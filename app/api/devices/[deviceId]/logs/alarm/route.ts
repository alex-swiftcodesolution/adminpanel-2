import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

type AlarmStatusItem = { code: string; value: unknown };

// v1.1 returns status as an array of objects.
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

// Per v1.1 docs, these are valid alarm codes
const DEFAULT_ALARM_CODES = "alarm_lock,hijack,doorbell";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // Build query based on the v1.1 documentation
  const query = {
    page_no: searchParams.get("page_no") ?? "1",
    page_size: searchParams.get("page_size") ?? "10",
    codes: searchParams.get("codes") ?? DEFAULT_ALARM_CODES,
    show_media_info: searchParams.get("show_media_info") ?? "false", // Required boolean parameter
  };

  try {
    // Corrected to use the v1.1 endpoint
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

    // v1.1 status is already an array, so no normalization is needed.
    // The previous normalization logic is kept for safety but is less critical now.
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
