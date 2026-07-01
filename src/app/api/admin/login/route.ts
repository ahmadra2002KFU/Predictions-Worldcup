import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getAdminSession } from "@/lib/adminAuth";
import { rateLimit } from "@/lib/rateLimit";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/ip";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent");

  if (!rateLimit(`admin-login:${ip ?? "unknown"}`, 5, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  const expected = Buffer.from(process.env.ADMIN_SECRET ?? "");
  const given = Buffer.from(password);
  const ok = expected.length > 0 && given.length === expected.length && timingSafeEqual(given, expected);

  await writeAuditLog({
    action: ok ? "ADMIN_LOGIN_SUCCESS" : "ADMIN_LOGIN_FAIL",
    ip,
    userAgent,
  });

  if (!ok) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  const session = await getAdminSession();
  session.isAdmin = true;
  await session.save();

  return NextResponse.json({ ok: true });
}
