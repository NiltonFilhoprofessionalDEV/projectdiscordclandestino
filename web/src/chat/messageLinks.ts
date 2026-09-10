const URL_PATTERN =
  /\b((?:https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?"')\]])/gi;

export type TextPart = { type: "text"; value: string } | { type: "link"; value: string; href: string };

function toHref(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/** Split message text into plain segments and safe http(s) links. */
export function splitMessageLinks(content: string): TextPart[] {
  if (!content) {
    return [];
  }
  const parts: TextPart[] = [];
  let lastIndex = 0;
  for (const match of content.matchAll(URL_PATTERN)) {
    const value = match[0] ?? "";
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, index) });
    }
    const href = toHref(value);
    if (href) {
      parts.push({ type: "link", value, href });
    } else {
      parts.push({ type: "text", value });
    }
    lastIndex = index + value.length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }
  return parts.length > 0 ? parts : [{ type: "text", value: content }];
}
