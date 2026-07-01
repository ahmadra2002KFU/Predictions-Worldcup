import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "./db";

export interface SessionData {
  sessionId?: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "mufeed_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function getCurrentParticipant() {
  const session = await getSession();
  if (!session.sessionId) return null;

  const dbSession = await prisma.session.findUnique({
    where: { id: session.sessionId },
    include: { participant: true },
  });

  if (!dbSession || dbSession.revokedAt) return null;
  return dbSession.participant;
}
