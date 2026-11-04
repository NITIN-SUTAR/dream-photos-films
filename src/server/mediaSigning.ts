import { createHmac, timingSafeEqual } from "node:crypto";

function mediaSecret(): string {
  return process.env.MEDIA_SIGNING_SECRET ?? process.env.DATABASE_URL ?? "dpf-dev-secret";
}

export function signMediaPath(path: string, ttlSeconds = 300): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = createHmac("sha256", mediaSecret()).update(`${path}:${exp}`).digest("base64url");
  return `exp=${exp}&sig=${sig}`;
}

export function verifyMediaSignature(path: string, exp: string, sig: string): boolean {
  const expNum = Number(exp);
  if (!expNum || expNum * 1000 < Date.now()) return false;
  const expected = createHmac("sha256", mediaSecret())
    .update(`${path}:${expNum}`)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
