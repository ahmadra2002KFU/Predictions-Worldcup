import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get("name")?.trim();
  if (!name) return NextResponse.json({ taken: false });

  const existing = await prisma.participant.findFirst({
    where: { displayName: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });

  return NextResponse.json({ taken: Boolean(existing) });
}
