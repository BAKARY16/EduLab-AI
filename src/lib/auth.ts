import { cookies } from "next/headers";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHmac,
} from "crypto";
import { db } from "@/db";
import { users, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const SESSION_COOKIE = "edulab_session";
const SECRET =
  process.env.SESSION_SECRET ||
  "edulab-dev-secret-change-me-in-production-please";

/* ---------- Password hashing (scrypt) ---------- */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const test = scryptSync(password, salt, 64);
  if (test.length !== hashBuf.length) return false;
  return timingSafeEqual(test, hashBuf);
}

/* ---------- Signed session token ---------- */
function signToken(payload: { uid: string; role: string }) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verifyToken(token: string): { uid: string; role: string } | null {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = createHmac("sha256", SECRET).update(data).digest("base64url");
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function setSession(
  uid: string,
  role: string,
  resHeaders?: Headers,
) {
  const token = signToken({ uid, role });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<{
  uid: string;
  role: string;
} | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  profile: (typeof profiles.$inferSelect) | null;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;
  const [u] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.uid))
    .limit(1);
  if (!u) return null;
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, u.id))
    .limit(1);
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    profile: profile ?? null,
  };
}

export async function requireUser(redirectTo = "/auth/login"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error(`__REDIRECT__${redirectTo}`);
  }
  return user;
}

export { hashPassword, verifyPassword };
