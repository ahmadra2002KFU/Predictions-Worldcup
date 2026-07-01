import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { registerSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rateLimit";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/ip";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent");

  if (!rateLimit(`register:${ip ?? "unknown"}`, 5, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { displayName, email, agreedToRules } = parsed.data;
  if (!agreedToRules) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const participant = await prisma.participant.create({
    data: { displayName, email: email || null },
  });

  const dbSession = await prisma.session.create({
    data: { participantId: participant.id, ip, userAgent },
  });

  await writeAuditLog({
    action: "REGISTER",
    participantId: participant.id,
    ip,
    userAgent,
    metadata: { displayName },
  });

  const session = await getSession();
  session.sessionId = dbSession.id;
  await session.save();

  return NextResponse.json({ participant: { id: participant.id, displayName: participant.displayName } });
}
