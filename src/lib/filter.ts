export type FilterableItem = {
  title: string;
  description?: string;
  originalUrl: string;
  publishedAt: string | null;
};

const relevantKeywords = ['みずほまる', '瑞穂町', '東京都瑞穂町'];

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function isRelevantItem(item: Pick<FilterableItem, 'title' | 'description'>): boolean {
  const haystack = normalize(`${item.title} ${item.description ?? ''}`);

  if (haystack.includes('瑞穂丸') && !haystack.includes('みずほまる') && !haystack.includes('瑞穂町')) {
    return false;
  }

  return relevantKeywords.some((keyword) => haystack.includes(normalize(keyword)));
}

export function dedupeItems<T extends FilterableItem>(items: T[]): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.originalUrl}::${item.publishedAt ?? ''}::${normalize(item.title)}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function sortNewestFirst<T extends FilterableItem>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftTime = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
    const rightTime = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;

    return rightTime - leftTime;
  });
}
