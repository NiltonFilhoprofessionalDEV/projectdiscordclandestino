const PENDING_INVITE_KEY = "pendingInviteToken";

export function captureInviteFromLocation(): string | null {
  const match = window.location.pathname.match(/^\/invite\/([^/]+)\/?$/);
  if (!match?.[1]) {
    return null;
  }
  const token = decodeURIComponent(match[1]);
  sessionStorage.setItem(PENDING_INVITE_KEY, token);
  window.history.replaceState(null, "", "/");
  return token;
}

export function takePendingInvite(): string | null {
  const token = sessionStorage.getItem(PENDING_INVITE_KEY);
  if (!token) {
    return null;
  }
  sessionStorage.removeItem(PENDING_INVITE_KEY);
  return token;
}

export function inviteUrl(token: string, origin = window.location.origin): string {
  return `${origin}/invite/${encodeURIComponent(token)}`;
}
