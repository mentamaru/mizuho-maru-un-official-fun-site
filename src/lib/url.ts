const allowedProtocols = new Set(['http:', 'https:']);

export function toAbsoluteHttpUrl(value: string | null | undefined): string | null {
  if (!value || /[\p{Cc}\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/u.test(value)) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (!allowedProtocols.has(parsed.protocol) || parsed.username || parsed.password) {
      return null;
    }

    parsed.hash = '';
    if (parsed.pathname !== '/') {
      parsed.pathname = parsed.pathname.replace(/\/+$/u, '') || '/';
    }

    return parsed.toString();
  } catch {
    return null;
  }
}
