import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const COOKIE_NAME = "whatsbet_session";
const secret = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET ?? "dev-secret-change-me"
);

const PUBLIC_API = [
  "/api/auth/login",
  "/api/webhooks/",
  "/api/cron/",
];

function isPublicApi(pathname: string) {
  return PUBLIC_API.some((p) => pathname.startsWith(p));
}

async function hasValidSession(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/api/auth/login" && req.method === "POST") {
    const ip = clientIp(req);
    const rl = rateLimit(`login:${ip}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
    }
  }

  if (pathname.startsWith("/api/webhooks/")) {
    const ip = clientIp(req);
    const rl = rateLimit(`webhook:${ip}`, 120, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/betika")) {
    const ok = await hasValidSession(req);
    if (!ok) {
      const login = new URL("/login", req.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  if (pathname.startsWith("/api/") && !isPublicApi(pathname)) {
    const ok = await hasValidSession(req);
    if (!ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/betika/:path*", "/api/:path*"],
};
