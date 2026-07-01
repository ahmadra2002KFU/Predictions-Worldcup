import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { recoverSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rateLimit";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/ip";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent");

  if (!rateLimit(`recover:${ip ?? "unknown"}`, 5, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = recoverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const { email } = parsed.data;

  const participant = await prisma.participant.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  await writeAuditLog({
    action: participant ? "RECOVER_SUCCESS" : "RECOVER_ATTEMPT",
    participantId: participant?.id ?? null,
    ip,
    userAgent,
    metadata: { email },
  });

  if (!participant) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const dbSession = await prisma.session.create({
    data: { participantId: participant.id, ip, userAgent },
  });

  const session = await getSession();
  session.sessionId = dbSession.id;
  await session.save();

  return NextResponse.json({ participant: { id: participant.id, displayName: participant.displayName } });
}
