// src/app/api/devices/[deviceId]/details/route.ts
import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

interface TuyaDeviceResult {
  id: string;
  name: string;
  is_online: boolean;
  category?: string;
  product_name?: string;
  model?: string;
  ip?: string;
  icon?: string;
  [extra: string]: unknown;
}

interface TuyaDeviceResponse {
  result: TuyaDeviceResult;
  success: boolean;
  msg?: string;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await context.params;

  try {
    const response = await tuyaClient.request<TuyaDeviceResponse>({
      method: "GET",
      path: `/v2.0/cloud/thing/${deviceId}`,
    });

    const { result, success, msg } = response.data;

    console.log("Tuya Device Details Response:", response.data);

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
        online: result.is_online, // now fully typed
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
