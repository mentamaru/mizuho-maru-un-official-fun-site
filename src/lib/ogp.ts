import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

import { toAbsoluteHttpUrl } from './url';

const ogImageProperty = /^og:image(?::url)?$/iu;
const redirectStatuses = new Set([301, 302, 303, 307, 308]);
const maxRedirects = 3;
type HostResolver = (hostname: string) => Promise<Array<{ address: string; family: number }>>;
const resolveHost: HostResolver = hostname => lookup(hostname, { all: true, verbatim: true });

function attributes(tag: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gu)) {
    const [, name, doubleQuoted, singleQuoted, unquoted] = match;
    result[name.toLowerCase()] = doubleQuoted ?? singleQuoted ?? unquoted ?? '';
  }
  return result;
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(amp|apos|quot|lt|gt);|&#(x[\da-f]+|\d+);/giu, (_, named: string | undefined, numeric: string | undefined) => {
    if (named) return ({ amp: '&', apos: "'", quot: '"', lt: '<', gt: '>' })[named.toLowerCase()] ?? _;
    if (!numeric) return _;
    const codePoint = Number.parseInt(numeric, numeric.startsWith('x') || numeric.startsWith('X') ? 16 : 10);
    try { return String.fromCodePoint(codePoint); } catch { return _; }
  });
}

function isPublicIpv4(address: string): boolean {
  const [a, b] = address.split('.').map(Number);
  return a !== 0 && a !== 10 && a !== 127 && a < 224 && !(a === 100 && b >= 64 && b <= 127) && !(a === 169 && b === 254) && !(a === 172 && b >= 16 && b <= 31) && !(a === 192 && (b === 0 || b === 168)) && !(a === 198 && (b === 18 || b === 19)) && !(a === 198 && b === 51) && !(a === 203 && b === 0);
}

function isPublicIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === '::' || normalized === '::1' || normalized.startsWith('::ffff:')) return false;
  const groups = normalized.split(':').filter(Boolean).map(group => Number.parseInt(group, 16));
  const first = groups[0] ?? 0;
  const second = groups[1] ?? 0;
  return (first & 0xfe00) !== 0xfc00 && (first & 0xffc0) !== 0xfe80 && !(first === 0x2001 && second === 0x0db8);
}

function isPublicAddress(address: string): boolean {
  return isIP(address) === 4 ? isPublicIpv4(address) : isIP(address) === 6 && isPublicIpv6(address);
}

/** Validate saved image URLs without DNS or HTTP requests during static rendering. */
export function savedThumbnailUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^\[|\]$/gu, '').replace(/\.$/u, '');
    if (url.protocol !== 'https:' || url.username || url.password ||
        !host.includes('.') && !isIP(host) ||
        host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') ||
        isIP(host) && !isPublicAddress(host)) return undefined;
    return url.href;
  } catch { return undefined; }
}

async function isSafeHttpsUrl(value: string, resolver: HostResolver): Promise<boolean> {
  const normalized = toAbsoluteHttpUrl(value);
  if (!normalized) return false;
  const url = new URL(normalized);
  if (url.protocol !== 'https:' || url.username || url.password) return false;
  try {
    const family = isIP(url.hostname);
    const addresses = family ? [{ address: url.hostname, family }] : await resolver(url.hostname);
    return addresses.length > 0 && addresses.every(({ address }) => isPublicAddress(address));
  } catch { return false; }
}

async function fetchPublicHttpsUrl(url: string, accept: string, fetcher: typeof fetch, resolver: HostResolver): Promise<{ response: Response; url: string } | null> {
  let currentUrl = url;
  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    if (!await isSafeHttpsUrl(currentUrl, resolver)) return null;
    const response = await fetcher(currentUrl, { redirect: 'manual', headers: { Accept: accept }, signal: AbortSignal.timeout(10_000) });
    if (!redirectStatuses.has(response.status)) return { response, url: currentUrl };
    const location = response.headers.get('location');
    if (!location) return null;
    try { currentUrl = new URL(location, currentUrl).toString(); } catch { return null; }
  }
  return null;
}

/** Extracts a remotely hosted OGP image without retaining the image itself. */
export function extractOgpImage(html: string, pageUrl: string): string | null {
  for (const tag of html.match(/<meta\b[^>]*>/giu) ?? []) {
    const values = attributes(tag);
    if (!ogImageProperty.test(values.property ?? values.name ?? '') || !values.content) continue;
    try {
      const imageUrl = new URL(decodeHtmlEntities(values.content), pageUrl).toString();
      if (imageUrl.startsWith('https://') && toAbsoluteHttpUrl(imageUrl)) return imageUrl;
    } catch { /* try the next OGP image candidate */ }
  }
  return null;
}

export async function fetchOgpImage(pageUrl: string, fetcher: typeof fetch = fetch, resolver: HostResolver = resolveHost): Promise<string | null> {
  try {
    const page = await fetchPublicHttpsUrl(pageUrl, 'text/html,application/xhtml+xml', fetcher, resolver);
    const pageType = page?.response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
    if (!page?.response.ok || !['text/html', 'application/xhtml+xml'].includes(pageType ?? '')) return null;
    const imageUrl = extractOgpImage(await page.response.text(), page.url);
    if (!imageUrl) return null;
    const image = await fetchPublicHttpsUrl(imageUrl, 'image/avif,image/webp,image/*', fetcher, resolver);
    return image?.response.ok && image.response.headers.get('content-type')?.toLowerCase().startsWith('image/') ? image.url : null;
  } catch { return null; }
}
