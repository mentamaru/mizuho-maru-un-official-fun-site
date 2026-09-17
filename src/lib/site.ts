// v2では独自ドメインではなくVercel Production URLを正規URLにする。
const defaultProductionSiteUrl = 'https://mizuho-maru-un-official-fun-site.vercel.app/';

function resolveProductionSiteUrl(value = process.env.PUBLIC_SITE_URL): URL {
  const url = new URL(value ?? defaultProductionSiteUrl);
  // canonicalやsitemapへHTTP URLを混入させない。
  if (url.protocol !== 'https:') throw new Error('PUBLIC_SITE_URL must use HTTPS.');
  return new URL('/', url);
}

export const productionSiteUrl = resolveProductionSiteUrl();
// VercelがPreview build時に設定する環境変数。ローカルとProductionはfalseになる。
export const isPreviewDeployment = process.env.VERCEL_ENV === 'preview';

export function buildSeoMetadata(pathname: string, preview = isPreviewDeployment) {
  if (preview) {
    // Preview URLを検索結果やSNS共有の正規URLとして扱わせない。
    return {
      canonicalUrl: undefined,
      robots: 'noindex, nofollow',
      shareUrl: undefined
    };
  }

  const url = new URL(pathname, productionSiteUrl).href;
  return {
    canonicalUrl: url,
    robots: 'index, follow',
    shareUrl: url
  };
}

export function productionUrl(pathname: string): string {
  // URL生成を一か所に集め、canonical・robots・sitemapのOriginを一致させる。
  return new URL(pathname, productionSiteUrl).href;
}
