const allowedProtocols = new Set(['http:', 'https:']);

export function toAbsoluteHttpUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    return allowedProtocols.has(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}
