export type SocialEntry = {
  id: string;
  platform: 'x' | 'instagram';
  accountId: string;
  displayName: string;
  profileUrl: string;
  category: string;
  enabled: boolean;
};

export function groupSocialEntries(entries: SocialEntry[]): Record<'x' | 'instagram', SocialEntry[]> {
  return {
    x: entries.filter((entry) => entry.enabled && entry.platform === 'x'),
    instagram: entries.filter((entry) => entry.enabled && entry.platform === 'instagram')
  };
}

export function getEmbedScriptUrl(platform: SocialEntry['platform']): string {
  return platform === 'x' ? 'https://platform.twitter.com/widgets.js' : 'https://www.instagram.com/embed.js';
}
