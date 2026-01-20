import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });

  res.cookies.set("orchid_session", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  res.cookies.set("orchid_force_pw_change", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return res;
}
