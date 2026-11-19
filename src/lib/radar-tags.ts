// ブラウザー側のスクリプトからも参照できるよう、Node依存を持たない純粋な定義だけを置く。
export const categories = ['event', 'appearance', 'goods', 'sale', 'collaboration', 'media', 'broadcast', 'campaign', 'recruitment', 'other'] as const;
export const radarTags = [...categories, 'food', 'giveaway'] as const;
export const radarTagLabels: Record<typeof radarTags[number], string> = {
  event: 'イベント', appearance: '出演・登場', goods: 'グッズ', sale: '販売情報', collaboration: 'コラボ',
  media: 'メディア掲載', broadcast: '放送', campaign: 'キャンペーン', recruitment: '募集', other: 'その他',
  food: '飲食・お菓子', giveaway: '配布・プレゼント'
};
