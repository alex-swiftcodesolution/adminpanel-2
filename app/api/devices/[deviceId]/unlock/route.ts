// src/app/api/devices/[deviceId]/unlock/route.ts

import { NextResponse } from "next/server";
import { tuyaClient } from "@/lib/tuya-connector";

// Define an interface to describe the shape of the ticket API's result object.
// This gives us type safety and autocomplete.
interface TicketResult {
  ticket_id: string;
  ticket_key: string;
  expire_time: number;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ deviceId: string }> }
) {
  const { deviceId } = await context.params;

  if (!deviceId) {
    return NextResponse.json(
      { success: false, message: "Device ID is required." },
      { status: 400 }
    );
  }

  try {
    const ticketResponse = await tuyaClient.request({
      method: "POST",
      path: `/v1.0/smart-lock/devices/${deviceId}/password-ticket`,
      body: {},
    });

    // Assert that the `result` property conforms to our `TicketResult` interface.
    const ticketResult = ticketResponse.data.result as TicketResult;

    if (!ticketResponse.data.success || !ticketResult?.ticket_id) {
      return NextResponse.json(
        {
          success: false,
          message: `Failed to get unlock ticket: ${ticketResponse.data.msg}`,
        },
        { status: 502 }
      );
    }

    // Now we can safely destructure ticket_id from our typed result.
    const { ticket_id } = ticketResult;

    const unlockResponse = await tuyaClient.request({
      method: "POST",
      path: `/v1.0/smart-lock/devices/${deviceId}/password-free/door-operate`,
      body: { ticket_id, open: true },
    });

    if (!unlockResponse.data.success) {
      return NextResponse.json(
        {
          success: false,
          message: `Failed to unlock door: ${unlockResponse.data.msg}`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Door unlocked successfully.",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
