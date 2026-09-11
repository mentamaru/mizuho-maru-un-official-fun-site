export const siteCopy = {
  siteTitle: '非公式みずほまる情報ポータル',
  siteDescription:
    '東京都瑞穂町公式キャラクター「みずほまる」に関する公開情報のまとめサイトです。',
  socialDisclaimer:
    'みずほまるに関連する企業・店舗・クリエイターなどの公開SNSを紹介しています。瑞穂町公式アカウントとは限りません。',
  unofficialDisclaimer:
    '本サイトは個人が運営する非公式のみずほまる情報サイトです。瑞穂町および掲載している企業・団体等とは関係ありません。',
  contactNote:
    'お問い合わせ導線は仮実装です。公開前に外部フォーム等へ差し替えてください。'
} as const;

export const navigationTabs = [
  { id: 'latest', label: '最新情報' },
  { id: 'related', label: '関連情報' },
  { id: 'social', label: '関連SNS' },
  { id: 'links', label: 'リンク集' }
] as const;

export const socialPlatforms = [
  { id: 'x', label: 'X' },
  { id: 'instagram', label: 'Instagram' }
] as const;
