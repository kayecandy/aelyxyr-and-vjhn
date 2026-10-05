import "server-only";
import { createHmac } from "node:crypto";
import { cookies } from "next/headers";

const SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me";
const COOKIE = "av_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

type Payload = { id: string };

function sign(payload: Payload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verify(token: string): Payload | null {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const data = token.slice(0, dot);
  const sig  = token.slice(dot + 1);
  const expected = createHmac("sha256", SECRET).update(data).digest("base64url");
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString());
  } catch {
    return null;
  }
}

export async function createSession(customerId: string) {
  (await cookies()).set(COOKIE, sign({ id: customerId }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<Payload | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? verify(token) : null;
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
