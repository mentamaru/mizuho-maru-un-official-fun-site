import { toAbsoluteHttpUrl } from './url';

/** Extract the safe Open Graph image URL from a whitelisted profile document. */
export function extractOpenGraphImage(html: string): string | undefined {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of metaTags) {
    const property = /\bproperty\s*=\s*["']og:image(?::secure_url)?["']/i.test(tag);
    if (!property) continue;
    const content = tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1];
    const url = content ? toAbsoluteHttpUrl(content) : null;
    if (url) return url;
  }
  return undefined;
}
