import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  // 1. Check university/company domain
  const allowedDomains = ["fau.de"]; // ⬅️ change to your real domains

  const validDomain = !!email && allowedDomains.some((d) => email.endsWith(`@${d}`));

  if (!validDomain) {
    return NextResponse.json(
      { error: "Please use your university/company email to log in." },
      { status: 401 }
    );
  }

  // 2. SUPER SIMPLE password check (for demo purposes)
  const DEMO_PASSWORD = "cranberry123"; // or read from env if you want

  if (password !== DEMO_PASSWORD) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  // 3. If valid → set a basic session cookie
  const res = NextResponse.json({ success: true });

  res.cookies.set("orchid_session", email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return res;
}
