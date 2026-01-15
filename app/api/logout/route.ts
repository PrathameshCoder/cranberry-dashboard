import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });

  // Delete the session cookie
  res.cookies.set("orchid_session", "", {
    httpOnly: true,
    expires: new Date(0), // instantly expire cookie
    path: "/",
  });

  return res;
}
