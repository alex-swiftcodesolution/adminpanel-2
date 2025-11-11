// src/lib/tuya-connector.ts

import { TuyaOpenApiClient } from "@tuya/tuya-connector-nodejs";

// This creates a singleton instance of the TuyaOpenAPI client.
// By initializing it here, we ensure it's only created once and can be reused.

export const tuyaClient = new TuyaOpenApiClient({
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  accessKey: process.env.TUYA_ACCESS_ID!,
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  secretKey: process.env.TUYA_SECRET_KEY!,
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  baseUrl: process.env.TUYA_BASE_URL!,
});

export default tuyaClient;
