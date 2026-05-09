// Lightweight admin session. Single shared password gate (NOT a user system).
// HMAC-SHA256 over Web Crypto so it runs in middleware (edge runtime).

export const SESSION_COOKIE = "admin-session";
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("ADMIN_SESSION_SECRET is missing or too short");
  }
  return s;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return bytesToBase64Url(new Uint8Array(sig));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signSession(expiresAtMs: number): Promise<string> {
  const exp = String(Math.floor(expiresAtMs));
  const sig = await hmac(exp, getSecret());
  return `${exp}.${sig}`;
}

export async function verifySession(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 2) return false;
  const [exp, sig] = parts as [string, string];
  if (!/^\d+$/.test(exp)) return false;
  const expMs = Number(exp);
  if (!Number.isFinite(expMs) || expMs <= Date.now()) return false;
  let expected: string;
  try {
    expected = await hmac(exp, getSecret());
  } catch {
    return false;
  }
  return timingSafeEqual(sig, expected);
}
