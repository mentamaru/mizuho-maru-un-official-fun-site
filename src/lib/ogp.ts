import { toAbsoluteHttpUrl } from './url';

const ogImageProperty = /^og:image(?::url)?$/iu;

function attributes(tag: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gu)) {
    const [, name, doubleQuoted, singleQuoted, unquoted] = match;
    result[name.toLowerCase()] = doubleQuoted ?? singleQuoted ?? unquoted ?? '';
  }
  return result;
}

/** Extracts a remotely hosted OGP image without retaining the image itself. */
export function extractOgpImage(html: string, pageUrl: string): string | null {
  for (const tag of html.match(/<meta\b[^>]*>/giu) ?? []) {
    const values = attributes(tag);
    if (!ogImageProperty.test(values.property ?? values.name ?? '') || !values.content) continue;
    try {
      const imageUrl = new URL(values.content, pageUrl).toString();
      return imageUrl.startsWith('https://') && toAbsoluteHttpUrl(imageUrl) ? imageUrl : null;
    } catch { return null; }
  }
  return null;
}

export async function fetchOgpImage(pageUrl: string, fetcher: typeof fetch = fetch): Promise<string | null> {
  try {
    const response = await fetcher(pageUrl, { headers: { Accept: 'text/html,application/xhtml+xml' }, signal: AbortSignal.timeout(10_000) });
    if (!response.ok || !response.headers.get('content-type')?.toLowerCase().includes('text/html')) return null;
    const imageUrl = extractOgpImage(await response.text(), response.url);
    if (!imageUrl) return null;
    const image = await fetcher(imageUrl, { headers: { Accept: 'image/avif,image/webp,image/*' }, signal: AbortSignal.timeout(10_000) });
    return image.ok && image.headers.get('content-type')?.toLowerCase().startsWith('image/') ? imageUrl : null;
  } catch { return null; }
}
