export type SocialEntry = {
  id: string;
  platform: 'x' | 'instagram';
  accountId: string;
  displayName: string;
  description?: string;
  profileUrl: string;
  ogImageUrl?: string;
  category: string;
  enabled: boolean;
};

export function groupSocialEntries(entries: SocialEntry[]): Record<'x' | 'instagram', SocialEntry[]> {
  return {
    x: entries.filter((entry) => entry.enabled && entry.platform === 'x'),
    instagram: entries.filter((entry) => entry.enabled && entry.platform === 'instagram')
  };
}
