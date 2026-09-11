import { expect, test } from '@playwright/test';

function isSocialEmbedRequest(url: string): boolean {
  const hostname = new URL(url).hostname;
  return hostname === 'platform.x.com' || hostname === 'www.instagram.com';
}

test.beforeEach(async ({page}) => {
  await page.route('https://platform.x.com/widgets.js', route => route.fulfill({ contentType: 'application/javascript', body: `window.twttr = {widgets: {createTimeline: async (source, target) => { const frame = document.createElement('iframe'); frame.title = 'X タイムライン'; target.append(frame); return frame; }}};` }));
});

test('top page renders latest tab first and original links exist', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('tab', { name: '最新情報' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: '最新情報' })).toBeVisible();
  await expect(page.getByText('みずほまるに関する公開情報から、最近の話題を紹介しています。')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'みずほまるレーダー' })).toBeVisible();
  await expect(page.getByRole('link', { name: '元情報を見る' }).first().or(page.getByText('現在、掲載できる最新情報はありません。'))).toBeVisible();
});

test('tab switching and SNS lazy loading work', async ({ page }) => {
  await page.route('https://platform.x.com/widgets.js', route => route.fulfill({ contentType: 'application/javascript', body: `window.twttr = {widgets: {createTimeline: async (source, target) => { const frame = document.createElement('iframe'); frame.title = 'X タイムライン'; target.append(frame); return frame; }}};` }));
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.goto('/');
  expect(requests.some(isSocialEmbedRequest)).toBe(false);

  await page.getByRole('tab', { name: '公式情報' }).click();
  await expect(page.getByRole('heading', { name: '公式情報' })).toBeVisible();
  await expect(page.getByRole('link', { name: '公式情報一覧を見る' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '公式リンク集' })).toBeVisible();

  await page.getByRole('tab', { name: '関連SNS' }).click();
  await expect(page.getByText('瑞穂町公式アカウントとは限りません。')).toBeVisible();
  await expect.poll(() => requests.some((url) => new URL(url).hostname === 'platform.x.com')).toBeTruthy();
  await expect(page.locator('#mizuho-koho-x-embed iframe')).toBeVisible();
  await expect(page.locator('#mizuho-koho-x-embed iframe')).toBeVisible();
  await expect(page.locator('#mizuho-koho-x-status')).toBeEmpty();
  await expect(page.getByRole('button', {name:'再試行する'})).toBeHidden();
  await page.getByRole('tab', {name:'最新情報', exact:true}).click();
  await page.getByRole('tab', {name:'関連SNS', exact:true}).click();
  expect(requests.filter(url => url === 'https://platform.x.com/widgets.js')).toHaveLength(1);
  await expect(page.getByRole('link', { name: '瑞穂町（東京都）広報公式 X' }).first()).toBeVisible();

});

test('X timelines are queued instead of starting together', async ({ page }) => {
  await page.route('https://platform.x.com/widgets.js', route => route.fulfill({ contentType: 'application/javascript', body: `
    window.__timelineStarts = [];
    window.twttr = {widgets: {createTimeline: async (source, target) => new Promise(resolve => {
      window.__timelineStarts.push(source.url);
      const render = () => { const frame = document.createElement('iframe'); frame.title = 'X タイムライン'; target.append(frame); resolve(frame); };
      if (window.__timelineStarts.length === 1) window.__releaseFirstTimeline = render; else render();
    })}};
  ` }));
  await page.goto('/');
  await page.getByRole('tab', { name: '関連SNS', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __timelineStarts?: string[] }).__timelineStarts?.length ?? 0)).toBe(1);
  expect(await page.locator('#mizuho-koho-x-embed').getAttribute('data-loading')).toBe('true');
  expect(await page.locator('#marumaru-mizuho-x-embed').getAttribute('data-queued')).toBe('true');
  await page.evaluate(() => (window as typeof window & { __releaseFirstTimeline?: () => void }).__releaseFirstTimeline?.());
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __timelineStarts?: string[] }).__timelineStarts?.length ?? 0)).toBe(2);
  await expect(page.locator('#marumaru-mizuho-x-embed iframe')).toBeVisible();
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

test('X failures can be retried without losing the external link', async ({ page }) => {
  let attempts = 0;
  await page.route('https://platform.x.com/widgets.js', route => {
    attempts++;
    return attempts === 1 ? route.abort() : route.fulfill({ contentType: 'application/javascript', body: `window.twttr = {widgets: {createTimeline: async (source, target) => { const frame = document.createElement('iframe'); frame.title = 'X'; target.append(frame); return frame; }}};` });
  });
  await page.goto('/#social');
  await expect(page.locator('#mizuho-koho-x-status')).toContainText('表示できませんでした');
  await expect(page.getByRole('link', {name:'瑞穂町（東京都）広報公式 X', exact:true})).toBeVisible();
  await page.locator('[data-status-id="mizuho-koho-x-status"]').click();
  await expect(page.locator('#mizuho-koho-x-embed iframe')).toBeVisible();
  await expect(page.locator('#mizuho-koho-x-status')).toBeEmpty();
  expect(attempts).toBe(2);
});

for (const width of [375, 1280]) {
  test(`all panels fit at ${width}px and keyboard navigation works`, async ({page}) => {
    await page.setViewportSize({width, height:900});
    await page.goto('/');
    for (const name of ['最新情報', 'みずほまるレーダー', '公式情報', '関連SNS']) {
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
  expect(requests).toBe(0);
  await page.getByRole('tab', {name:'Instagram', exact:true}).click();
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
