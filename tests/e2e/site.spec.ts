import { expect, test } from '@playwright/test';

function isXEmbedRequest(url: string): boolean {
  return ['platform.x.com', 'platform.twitter.com', 'syndication.twitter.com'].includes(new URL(url).hostname);
}

test('top page renders latest tab first and original links exist', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('tab', { name: '最新情報' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: '最新情報' })).toBeVisible();
  await expect(page.getByText('みずほまるに関する公開情報から、最近の話題を紹介しています。')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'みずほまるレーダー' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'マップ' })).toBeVisible();
  await expect(page.locator('#latest-panel').getByText('第20回瑞穂町こどもフェスティバルにみずほまるが登場')).toBeVisible();
  await expect(page.getByRole('link', { name: '元情報を見る' }).first().or(page.getByText('現在、掲載できる最新情報はありません。'))).toBeVisible();
});

test('production SEO metadata and crawler files use the v2 Vercel URL', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://mizuho-maru-un-official-fun-site.vercel.app/'
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    'https://mizuho-maru-un-official-fun-site.vercel.app/'
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary');

});

test('Vercel Analytics is included once in the shared layout', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('vercel-analytics')).toHaveCount(1);
});

test('map tab displays both Mizuho-maru maps responsively', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/');

  await page.getByRole('tab', { name: 'マップ', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'マップ', exact: true })).toBeVisible();
  await expect(page.getByText('みずほまる関連の地図です。主に東京都瑞穂町を中心に紹介しています。')).toBeVisible();
  await expect(page.getByText('主にグッズを取り扱っているエリアを紹介しています。')).toBeVisible();
  await expect(page.getByText('イベントでの出演が多いエリアを紹介しています。')).toBeVisible();

  for (const [title, mid] of [
    ['みずほまるグッズマップ', '1ZV5EpLJDfQTXTPZs6x1O5tqj8546h3I'],
    ['みずほまるイベントマップ', '1MORDRyzpqRKW5FQ0cB5FrqS_4VYqvag']
  ]) {
    const map = page.locator(`iframe[title="${title}"]`);
    await expect(map).toBeVisible();
    await expect(map).toHaveAttribute('src', new RegExp(`mid=${mid}`));
    await expect(map).toHaveAttribute('loading', 'lazy');
  }

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('tab switching and SNS lazy loading work', async ({ page }) => {
  await page.route('https://www.instagram.com/marumaru_mizuho/embed/', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Instagram</body></html>' }));
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.goto('/');
  expect(requests.some(isXEmbedRequest)).toBe(false);

  await page.getByRole('tab', { name: '公式情報' }).click();
  await expect(page.getByRole('heading', { name: '公式情報' })).toBeVisible();
  await expect(page.getByRole('link', { name: '公式情報一覧を見る' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '公式リンク集' })).toBeVisible();

  await page.getByRole('tab', { name: '関連SNS' }).click();
  await expect(page.getByText('瑞穂町公式アカウントとは限りません。')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Instagram', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('iframe[title="marumaru_mizuho のInstagramプロフィール"]')).toBeVisible();
  await page.getByRole('tab', { name: 'X', exact: true }).click();
  await expect(page.locator('#mizuho-koho-x-embed')).toBeVisible();
  await page.getByRole('tab', {name:'最新情報', exact:true}).click();
  await page.getByRole('tab', {name:'関連SNS', exact:true}).click();
  expect(requests.filter(isXEmbedRequest)).toHaveLength(0);
  await expect(page.getByRole('link', { name: '瑞穂町（東京都）広報公式 X' }).first()).toBeVisible();

});

test('X uses cached profile OGP cards and makes no X embed request', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/');
  expect(requests.some(isXEmbedRequest)).toBe(false);
  await page.getByRole('tab', { name: '関連SNS', exact: true }).click();
  await page.getByRole('tab', { name: 'X', exact: true }).click();
  await expect(page.locator('#mizuho-koho-x-embed')).toBeVisible();
  await expect(page.locator('#mizuho-koho-x-embed img')).toHaveAttribute('src', 'https://pbs.twimg.com/profile_images/832159545178722304/gyOcS0gO_200x200.jpg');
  await expect(page.locator('#mizuho-koho-x-embed img')).toHaveAttribute('alt', '瑞穂町（東京都）広報公式 X のプロフィール画像');
  expect(requests.filter(isXEmbedRequest)).toHaveLength(0);
});

test('layout does not overflow at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/');

  const hasHorizontalOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth;
  });

  expect(hasHorizontalOverflow).toBe(false);
});

for (const path of ['/about', '/operator', '/contact', '/github']) {
  test(`auxiliary navigation works from ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.getByRole('navigation', {name: 'メインナビゲーション'}).getByRole('link', {name: '関連SNS'}).click();
    await expect(page.getByRole('tab', {name: '関連SNS', exact: true})).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', {name: '関連SNS'})).toBeVisible();
  });
}

test('contact form and GitHub guidance are available', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.getByRole('link', { name: 'お問い合わせフォームを開く' })).toHaveAttribute(
    'href',
    'https://docs.google.com/forms/d/e/1FAIpQLSd4rG59lzW9_UMBxX1u85l2FMBHQUiaaP9NvqEHHqfL9THLMw/viewform?usp=dialog'
  );

  await page.goto('/github');
  await expect(page.getByRole('heading', { name: 'GitHubについて' })).toBeVisible();
  await expect(page.getByText('現在、GitHubリポジトリは非公開です。')).toBeVisible();
  await expect(page.getByText('パブリックリポジトリとして公開する予定です。')).toBeVisible();
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', '/github');
});

for (const width of [375, 1280]) {
  test(`all panels fit at ${width}px and keyboard navigation works`, async ({page}) => {
    await page.setViewportSize({width, height:900});
    await page.goto('/');
    for (const name of ['最新情報', 'みずほまるレーダー', '公式情報', '関連SNS', 'マップ']) {
      await page.getByRole('tab', {name, exact:true}).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.getByRole('tab', {name:'最新情報', exact:true}).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', {name:'みずほまるレーダー', exact:true})).toBeFocused();
    await expect(page.getByRole('heading', {name:'みずほまるレーダー', exact:true})).toBeVisible();
  });
}

test('Instagram profile embeds only when its tab opens', async ({page}) => {
  let requests = 0;
  await page.route('https://www.instagram.com/marumaru_mizuho/embed/', route => {
    requests++;
    return route.fulfill({contentType:'text/html', body:'<html lang="ja"><body>イベント情報</body></html>'});
  });
  await page.goto('/');
  expect(requests).toBe(0);
  await page.getByRole('tab', {name:'関連SNS', exact:true}).click();
  await expect.poll(() => requests).toBe(1);
  const frame = page.locator('iframe[title="marumaru_mizuho のInstagramプロフィール"]');
  await expect(frame).toBeVisible();
  expect(await frame.evaluate(element => { const parent = element.parentElement!; return parent.clientHeight >= element.clientHeight; })).toBe(true);
  await expect(frame).toHaveAttribute('src', 'https://www.instagram.com/marumaru_mizuho/embed/');
  await expect(page.getByText('イベント情報はこちらのアカウントからご確認ください。', {exact:true})).toBeVisible();
  await expect(page.getByRole('link', {name:'Instagramで見る'})).toHaveCount(0);
  await expect.poll(() => requests).toBe(1);
  await expect(page.getByRole('link', {name:'marumaru_mizuho', exact:true})).toHaveAttribute('href', 'https://www.instagram.com/marumaru_mizuho/');
  await page.getByRole('tab', {name:'X', exact:true}).click();
  await page.getByRole('tab', {name:'Instagram', exact:true}).click();
  expect(requests).toBe(1);
});
