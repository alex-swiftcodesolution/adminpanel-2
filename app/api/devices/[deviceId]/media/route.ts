// src/app/api/devices/[deviceId]/media/route.ts
import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

interface TuyaMediaResponse {
  result: {
    file_url: string;
    file_key?: string;
    bucket?: string;
  };
  success: boolean;
  msg?: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const key = searchParams.get("key");

  if (!url || !key) {
    return NextResponse.json(
      { success: false, message: "Missing url or key" },
      { status: 400 }
    );
  }

  try {
    const response = await tuyaClient.request<TuyaMediaResponse>({
      method: "GET",
      path: `/v1.0/devices/${deviceId}/door-lock/media/url`,
      query: {
        bucket: "ty-eu-storage60-1254153901",
        file_path: key,
      },
    });

    const { result, success, msg } = response.data;

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
