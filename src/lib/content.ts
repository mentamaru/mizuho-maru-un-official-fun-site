export const siteCopy = {
  sourceLinkLabel: '元情報を見る',
  siteTitle: '非公式みずほまる情報ポータル',
  siteDescription:
    '東京都瑞穂町公式キャラクター「みずほまる」に関する公開情報のまとめサイトです。',
  socialDisclaimer:
    'みずほまるに関連する企業・店舗・クリエイターなどの公開SNSを紹介しています。瑞穂町公式アカウントとは限りません。',
  unofficialDisclaimer:
    '本サイトは個人が運営する非公式のみずほまる情報サイトです。瑞穂町および掲載している企業・団体等とは関係ありません。',
  repositoryUrl: 'https://github.com/mentamaru/mizuho-maru-un-official-fun-site',
  contactUrl:
    'https://docs.google.com/forms/d/e/1FAIpQLSd4rG59lzW9_UMBxX1u85l2FMBHQUiaaP9NvqEHHqfL9THLMw/viewform?usp=dialog'
} as const;

export const navigationTabs = [
  { id: 'latest', label: '最新情報' },
  { id: 'radar', label: 'みずほまるレーダー' },
  { id: 'official', label: '公式情報' },
  { id: 'social', label: '関連SNS' },
  { id: 'maps', label: 'マップ' }
] as const;

export const socialPlatforms = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'x', label: 'X' }
] as const;
