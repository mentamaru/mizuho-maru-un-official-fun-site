import { expect, test, type Page } from '@playwright/test';

const calendar = (page: Page) => page.locator('[data-event-calendar]');
const open = async (page: Page, now = '2026-11-19T05:00:00Z', path = '/__test/calendar') => {
  await page.clock.setFixedTime(new Date(now));
  await page.goto(path);
  await calendar(page).scrollIntoViewIfNeeded();
  await expect(page.locator('[data-calendar-root].fc')).toBeVisible();
};

test('renders the current Tokyo month with a legend and tag colors', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('heading', { name: 'みずほまるイベントカレンダー' })).toBeVisible();
  await expect(page.locator('.fc-toolbar-title')).toHaveText('2026年11月');
  await expect(page.locator('.fc-day-today')).toHaveAttribute('data-date', '2026-11-19');
  const legend = page.locator('[data-calendar-legend]');
  await expect(legend).toContainText('● イベント');
  await expect(legend).toContainText('◆ 出演・登場');
  await expect(page.locator('.fc-event.fc-tag-appearance').first()).toBeVisible();
  await expect(page.locator('.fc-event.fc-tag-event').first()).toBeVisible();
  const colors = await page.evaluate(() => ['appearance', 'event'].map(tag => getComputedStyle(document.querySelector(`.fc-event.fc-tag-${tag}`)!).backgroundColor));
  expect(colors[0]).not.toBe(colors[1]);
});

for (const [now, today] of [['2026-11-18T14:59:00Z', '2026-11-18'], ['2026-11-18T15:01:00Z', '2026-11-19']]) {
  test(`highlights today in Asia/Tokyo at ${now}`, async ({ page }) => {
    await open(page, now);
    await expect(page.locator('.fc-day-today')).toHaveAttribute('data-date', today);
  });
}

test('starts at the nearest month when today is out of range and limits navigation', async ({ page }) => {
  await open(page, '2027-03-05T00:00:00Z');
  await expect(page.locator('.fc-toolbar-title')).toHaveText('2026年11月');
  await expect(page.locator('.fc-next-button')).toBeDisabled();
  await page.locator('.fc-prev-button').click();
  await expect(page.locator('.fc-toolbar-title')).toHaveText('2026年10月');
  await page.locator('.fc-prev-button').click();
  await expect(page.locator('.fc-toolbar-title')).toHaveText('2026年9月');
  await expect(page.locator('.fc-prev-button')).toBeDisabled();
  await expect(page.locator('.fc-today-button')).toBeDisabled();
});

test('returns to the current month with the today button', async ({ page }) => {
  await open(page);
  await page.locator('.fc-prev-button').click();
  await expect(page.locator('.fc-toolbar-title')).toHaveText('2026年10月');
  await page.getByRole('button', { name: '今月' }).click();
  await expect(page.locator('.fc-toolbar-title')).toHaveText('2026年11月');
});

test('shows the visible month events and narrows to a selected day', async ({ page }) => {
  await open(page);
  const status = page.locator('[data-calendar-status]');
  await expect(status).toContainText('2026年11月');
  await expect(page.locator('[data-calendar-list] li:visible')).toHaveCount(3);
  await page.locator('.fc-daygrid-day[data-date="2026-11-15"] .fc-daygrid-day-number').click();
  await expect(status).toContainText('11月15日');
  await expect(page.locator('[data-calendar-list] li:visible')).toHaveCount(1);
  await page.locator('.fc-daygrid-day[data-date="2026-11-14"] .fc-daygrid-day-number').click();
  await expect(page.locator('[data-calendar-list] li:visible')).toHaveCount(2);
  const link = page.locator('[data-calendar-list] li:visible a').first();
  await expect(link).toHaveAttribute('href', /^https:\/\/example\.com\//);
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.locator('[data-calendar-list] li:visible').first()).toContainText('みずほまるが登場するイベントについての概要説明です。');
  await page.getByRole('button', { name: '月の一覧に戻す' }).click();
  await expect(status).toContainText('2026年11月');
  await page.locator('.fc-prev-button').click();
  await expect(page.locator('[data-calendar-list] li:visible')).toHaveCount(2);
  await expect(page.locator('[data-calendar-list]')).toContainText('観光フェア');
});

test('selecting a bar shows only that event', async ({ page }) => {
  await open(page);
  await page.locator('.fc-event', { hasText: '産業まつりに登場' }).first().click();
  await expect(page.locator('[data-calendar-status]')).toContainText('産業まつりに登場');
  await expect(page.locator('[data-calendar-list] li:visible')).toHaveCount(1);
});

test('selecting a bar drawn on an adjacent-month day shows that event details', async ({ page }) => {
  await open(page);
  await page.locator('.fc-prev-button').click();
  await page.locator('.fc-prev-button').click();
  await expect(page.locator('.fc-toolbar-title')).toHaveText('2026年9月');
  await page.locator('.fc-event', { hasText: '観光フェア' }).first().click();
  await expect(page.locator('[data-calendar-status]')).toContainText('観光フェア');
  const visible = page.locator('[data-calendar-list] li:visible');
  await expect(visible).toHaveCount(1);
  await expect(visible).toContainText('観光フェア');
  await expect(visible).toContainText('概要説明');
  await expect(visible.locator('a')).toHaveAttribute('href', 'https://example.com/b');
});

for (const width of [375, 1280]) {
  test(`shows event titles inside the calendar at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page);
    const bar = page.locator('.fc-event', { hasText: '産業まつりに登場' }).first();
    await expect(bar).toBeVisible();
    await expect(bar.locator('.calendar-event-title')).toBeVisible();
    await expect(bar.locator('.calendar-event-title')).toHaveText('産業まつりに登場');
    await expect(bar.locator('.calendar-event-glyph')).toHaveText('◆');
    const title = await bar.locator('.calendar-event-title').boundingBox();
    expect(title!.width).toBeGreaterThan(10);
  });
}

test('a month-crossing event is one bar across days and continues in both months', async ({ page }) => {
  await open(page);
  const centerX = async (date: string) => {
    const box = (await page.locator(`.fc-daygrid-day[data-date="${date}"]`).boundingBox())!;
    return box.x + box.width / 2;
  };
  const spans = async () => {
    const bar = page.locator('.fc-event', { hasText: '月またぎイベント' });
    const boxes = (await bar.evaluateAll(elements => elements.map(element => { const rect = element.getBoundingClientRect(); return { left: rect.left, right: rect.right }; })));
    return boxes;
  };
  const covers = (boxes: { left: number; right: number }[], x: number) => boxes.some(box => box.left <= x && x <= box.right);
  await expect(page.locator('.fc-event', { hasText: '月またぎイベント' }).first()).toBeVisible();
  const november = await spans();
  expect(covers(november, await centerX('2026-11-01'))).toBe(true);
  expect(covers(november, await centerX('2026-11-02'))).toBe(true);
  expect(covers(november, await centerX('2026-11-03'))).toBe(false);
  await expect(page.locator('.fc-event.fc-event-end', { hasText: '月またぎイベント' })).toHaveCount(1);
  await expect(page.locator('.fc-event.fc-event-start', { hasText: '月またぎイベント' })).toHaveCount(0);
  await page.locator('.fc-prev-button').click();
  await expect(page.locator('.fc-toolbar-title')).toHaveText('2026年10月');
  const october = await spans();
  expect(covers(october, await centerX('2026-10-30'))).toBe(true);
  expect(covers(october, await centerX('2026-10-31'))).toBe(true);
  expect(covers(october, await centerX('2026-11-01'))).toBe(true);
  expect(covers(october, await centerX('2026-10-29'))).toBe(false);
  await expect(page.locator('.fc-event.fc-event-start', { hasText: '月またぎイベント' })).toHaveCount(1);
});

test('escapes event titles', async ({ page }) => {
  await open(page);
  await expect(page.locator('[data-calendar-list] img')).toHaveCount(0);
  await expect(page.locator('[data-calendar-list]')).toContainText('<img src=x onerror=alert(1)>');
});

test('keeps the static list without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/__test/calendar');
  await expect(page.locator('[data-calendar-list] li')).toHaveCount(6);
  for (const month of ['2026年9月', '2026年10月', '2026年11月']) await expect(page.locator('[data-calendar-list]')).toContainText(month);
  await expect(page.locator('[data-calendar-root].fc')).toHaveCount(0);
  await context.close();
});

test('keeps the static list when the library fails to load', async ({ page }) => {
  await page.route(/fullcalendar/i, route => route.abort());
  await page.goto('/__test/calendar');
  await calendar(page).scrollIntoViewIfNeeded();
  await expect(page.locator('[data-calendar-list] li:visible')).toHaveCount(6);
  await expect(page.locator('[data-calendar-root].fc')).toHaveCount(0);
});

test('renders nothing without events', async ({ page }) => {
  await page.goto('/__test/calendar-empty');
  await expect(calendar(page)).toHaveCount(0);
});

for (const width of [375, 1280]) {
  test(`fits ${width}px without page overflow and with touch-sized controls`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const locator of [page.locator('.fc-prev-button'), page.locator('.fc-next-button'), page.locator('.fc-today-button'), page.locator('.fc-daygrid-day[data-date="2026-11-19"]')]) {
      const box = await locator.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }
  });
}

test('loads without CSP violations', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await open(page);
  expect(errors.filter(text => !/vercel|_vercel/i.test(text))).toEqual([]);
});

test('is shown in the latest panel of the top page', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-19T05:00:00Z'));
  await page.goto('/');
  const section = page.locator('#latest-panel [data-event-calendar]');
  await expect(section).toBeVisible();
  // The AI disclosure can move this lazy-loaded section below the initial viewport.
  await section.scrollIntoViewIfNeeded();
  await expect(page.locator('#latest-panel [data-calendar-root].fc')).toBeVisible();
  await expect(page.locator('.fc-day-today')).toHaveAttribute('data-date', '2026-11-19');
  const [calendarBox, characterBox] = await Promise.all([section.boundingBox(), page.locator('#latest-panel #character-heading').boundingBox()]);
  expect(calendarBox!.y).toBeLessThan(characterBox!.y);
});
