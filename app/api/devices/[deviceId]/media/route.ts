import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

interface TuyaMediaResult {
  file_url: string;
  file_key?: string;
  bucket?: string;
}

interface TuyaResponse<T> {
  result: T;
  success: boolean;
  msg?: string;
  code?: number;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json(
      { success: false, message: "Missing key" },
      { status: 400 }
    );
  }

  try {
    const response = await tuyaClient.request<TuyaMediaResult>({
      method: "GET",
      path: `/v1.0/devices/${deviceId}/door-lock/media/url`,
      query: {
        bucket: searchParams.get("bucket") ?? "ty-eu-storage60-1254153901",
        file_path: key,
      },
    });

    const data = response.data as TuyaResponse<TuyaMediaResult>;
    const { result, success, msg } = data;

    if (!success) {
      return NextResponse.json(
        { success: false, message: msg || "Tuya media failed" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      result: { file_url: result.file_url },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Media fetch failed";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
