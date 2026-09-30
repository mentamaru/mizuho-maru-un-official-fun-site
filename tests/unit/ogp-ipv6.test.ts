import { expect, test, vi } from 'vitest';

import { fetchOgpImage, savedThumbnailUrl } from '../../src/lib/ogp';

const blocked = [
  'ff02::1', 'FF02:0:0:0:0:0:0:1', 'fec0::1',
  '::127.0.0.1', '::7f00:1', '0:0:0:0:0:0:7f00:1',
  '::2001:4860', '::', '::1', '::ffff:127.0.0.1',
  'fc00::1', 'fd00::1', 'fe80::1', '2001:db8::1',
  '2001:2::1', '2002:7f00:1::1', '64:ff9b::7f00:1', '100::1', '3fff::1'
];

test.each(blocked)('omits a saved thumbnail targeting special IPv6 %s', address => {
  expect(savedThumbnailUrl(`https://[${address}]/image.png`)).toBeUndefined();
});

test.each(blocked)('rejects DNS answers containing special IPv6 %s before HTTP', async address => {
  const fetcher = vi.fn<typeof fetch>();
  const resolver = vi.fn().mockResolvedValue([
    { address: '2606:4700:4700::1111', family: 6 }, { address, family: 6 }
  ]);
  await expect(fetchOgpImage('https://example.com/news', fetcher, resolver)).resolves.toBeNull();
  expect(fetcher).not.toHaveBeenCalled();
});

test.each(['ff02::1', 'fec0::1', '::127.0.0.1'])('rejects a redirect to special IPv6 %s without resolving a literal', async address => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, {
    status: 302, headers: { location: `https://[${address}]/image.png` }
  }));
  const resolver = vi.fn().mockResolvedValue([{ address: '2606:4700:4700::1111', family: 6 }]);
  await expect(fetchOgpImage('https://example.com/news', fetcher, resolver)).resolves.toBeNull();
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(resolver).toHaveBeenCalledTimes(1);
});

test.each(['2606:4700:4700::1111', '2001:4860:4860::8888', '2001:4860::8888'])('retains public IPv6 %s for saved images and OGP fetching', async address => {
  const imageUrl = `https://[${address}]/image.png`;
  expect(savedThumbnailUrl(imageUrl)).toBe(imageUrl);
  const fetcher = vi.fn<typeof fetch>()
    .mockResolvedValueOnce(new Response(`<meta property="og:image" content="${imageUrl}">`, { headers: { 'content-type': 'text/html' } }))
    .mockResolvedValueOnce(new Response('', { headers: { 'content-type': 'image/png' } }));
  const resolver = vi.fn().mockResolvedValue([{ address, family: 6 }]);
  await expect(fetchOgpImage('https://example.com/news', fetcher, resolver)).resolves.toBe(imageUrl);
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(resolver).toHaveBeenCalledTimes(1);
});
