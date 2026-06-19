import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AdminRole } from "@whatsbet/types";

const COOKIE_NAME = "whatsbet_session";
const secret = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET ?? "dev-secret-change-me"
);

export interface SessionPayload {
  adminId: string;
  email: string;
  role: AdminRole;
  name: string;
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function canWrite(role: AdminRole): boolean {
  return role === "SUPER_ADMIN" || role === "SUPPORT";
}

export function isBetikaReadOnly(role: AdminRole): boolean {
  return role === "BETIKA";
}
