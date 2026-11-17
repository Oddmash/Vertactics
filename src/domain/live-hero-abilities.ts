export type LiveAbility = { name: string; description: string; icon?: string };

const cache = new Map<string, Promise<LiveAbility[]>>();

export const loadHeroAbilities = (heroId: string, locale: 'ko' | 'en') => {
  const key = heroId + ':' + locale;
  const cached = cache.get(key);
  if (cached) return cached;

  const url = new URL('https://overfast-api.tekrop.fr/heroes/' + encodeURIComponent(heroId));
  url.searchParams.set('locale', locale === 'ko' ? 'ko-kr' : 'en-us');
  const request = fetch(url, { signal: AbortSignal.timeout(8000) }).then(async (response) => {
    if (!response.ok) throw new Error('Ability data unavailable');
    const data: { abilities?: unknown } | null = await response.json();
    if (!Array.isArray(data?.abilities)) throw new Error('Unexpected ability response');

    const abilities = data.abilities.flatMap((item: unknown): LiveAbility[] => {
      if (!item || typeof item !== 'object') return [];
      const { name, description, icon } = item as Record<string, unknown>;
      if (typeof name !== 'string' || !name.trim() || typeof description !== 'string' || !description.trim()) return [];
      return [{
        name,
        description,
        icon: typeof icon === 'string' && /^https:\/\/(d15f34w2p8l1cc\.cloudfront\.net|blz-contentstack-images\.akamaized\.net)\//.test(icon)
          ? icon : undefined,
      }];
    });
    if (!abilities.length) throw new Error('No abilities returned');
    return abilities;
  }).catch((error: unknown) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, request);
  return request;
};
