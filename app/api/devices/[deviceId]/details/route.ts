// src/app/api/devices/[deviceId]/details/route.ts
import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

type TuyaResponse<T> = {
  success: boolean;
  msg?: string;
  result: T;
};

type TuyaDeviceResult = {
  id: string;
  name: string;
  is_online?: boolean;
  online?: boolean;
  category?: string;
  product_name?: string;
  model?: string;
  ip?: string;
  icon?: string;
  [extra: string]: unknown;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await params;

  try {
    const response = await tuyaClient.request<TuyaDeviceResult>({
      method: "GET",
      path: `/v2.0/cloud/thing/${deviceId}`,
    });

    const { result, success, msg } =
      response.data as TuyaResponse<TuyaDeviceResult>;

    if (!success) {
      return NextResponse.json(
        { success: false, message: msg },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        online: result.is_online ?? result.online ?? false,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
