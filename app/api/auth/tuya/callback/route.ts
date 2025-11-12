// app/api/auth/tuya/callback/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) return NextResponse.redirect("/login?error=no_code");

  // Exchange code for access_token
  const res = await fetch("https://openapi.tuya.com/v1.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.TUYA_CLIENT_ID!,
      client_secret: process.env.TUYA_CLIENT_SECRET!,
      redirect_uri: "https://adminpanel-2.vercel.app/api/auth/tuya/callback",
    }),
  });

  const data = await res.json();
  // Save access_token + refresh_token in cookies/session
  const response = NextResponse.redirect("/dashboard");
  response.cookies.set("tuya_token", JSON.stringify(data), {
    httpOnly: true,
    maxAge: 7200,
  });
  return response;
}
