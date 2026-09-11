const allowedProtocols = new Set(['http:', 'https:']);

export function toAbsoluteHttpUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (!allowedProtocols.has(parsed.protocol)) {
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
