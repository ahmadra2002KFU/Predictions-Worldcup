import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export interface AdminSessionData {
  isAdmin?: boolean;
}

export const adminSessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "mufeed_admin",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  },
};

export async function getAdminSession() {
  return getIronSession<AdminSessionData>(await cookies(), adminSessionOptions);
}

export async function isAdminAuthenticated() {
  const session = await getAdminSession();
  return Boolean(session.isAdmin);
}

/** Guard for /api/admin/** route handlers. Returns true if authorized, else a 403 response to return. */
export async function requireAdmin(): Promise<true | NextResponse> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return true;
}
