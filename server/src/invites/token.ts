import { createHash, randomBytes } from "node:crypto";

export function hashInviteToken(raw: string): string {
  return createHash("sha256").update(raw).digest("base64url");
}

export function generateInviteToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashInviteToken(raw) };
}
