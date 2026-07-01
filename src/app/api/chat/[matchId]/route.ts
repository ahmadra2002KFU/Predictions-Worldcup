import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentParticipant } from "@/lib/session";
import { chatMessageSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rateLimit";
import { publish, type ChatMessageDTO } from "@/lib/realtime";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export async function GET(request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const before = new URL(request.url).searchParams.get("before");

  const messages = await prisma.chatMessage.findMany({
    where: { matchId, deletedAt: null, ...(before ? { id: { lt: before } } : {}) },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    include: { participant: { select: { displayName: true } } },
  });

  const ordered = messages.reverse().map((m) => ({
    id: m.id,
    matchId: m.matchId,
    participantId: m.participantId,
    displayName: m.participant.displayName,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
  }));

  return NextResponse.json({ messages: ordered });
}

export async function POST(request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const participant = await getCurrentParticipant();
  if (!participant) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { matchId } = await params;

  if (!rateLimit(`chat:${participant.id}`, 1, 2_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = chatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", issues: parsed.error.issues }, { status: 400 });
  }

  const chatMessage = await prisma.chatMessage.create({
    data: { matchId, participantId: participant.id, body: parsed.data.body },
  });

  const dto: ChatMessageDTO = {
    id: chatMessage.id,
    matchId,
    participantId: participant.id,
    displayName: participant.displayName,
    body: chatMessage.body,
    createdAt: chatMessage.createdAt.toISOString(),
  };

  publish({ channel: "chat", matchId, message: dto });

  return NextResponse.json({ message: dto });
}
