const summaries: Record<string, Record<string, { ko: string; en: string }>> = {
  tracer: {
    'pulse-pistols': { ko: '근거리에서 빠르게 발사하는 쌍권총입니다.', en: 'A pair of rapid-fire pistols for close combat.' },
    blink: { ko: '현재 이동 방향으로 순간이동합니다.', en: 'Dash instantly in your current movement direction.' },
    recall: { ko: '이전 위치로 돌아가며 당시의 생명력을 되찾습니다.', en: 'Return to a previous position and restore the health you had there.' },
    'pulse-bomb': { ko: '대상에 부착되는 폭탄을 던집니다.', en: 'Toss an explosive that can stick to a target.' },
  },
  ana: {
    'biotic-rifle': { ko: '아군을 치유하고 적에게 피해를 주는 소총입니다. 조준경으로 확대할 수 있습니다.', en: 'This scoped rifle heals allies and damages enemies.' },
    'sleep-dart': { ko: '적중한 적을 잠재우는 다트를 발사합니다.', en: 'Fire a dart that puts its target to sleep.' },
    'biotic-grenade': { ko: '아군을 치유하고 받는 치유량을 높입니다. 적에게는 피해를 주고 치유를 차단합니다.', en: 'A blast heals allies and boosts their incoming healing. Enemies take damage and cannot receive healing.' },
    'nano-boost': { ko: '아군 한 명이 주는 피해를 높이고 받는 피해를 줄입니다.', en: 'Empower one ally to deal more damage and take less.' },
  },
  ramattra: {
    'void-accelerator-omnic-form': { ko: '옴닉 형태에서 일정한 패턴으로 투사체를 연사합니다.', en: 'In Omnic form, fire a stream of projectiles in a set pattern.' },
    'void-barrier-omnic-form': { ko: '지정한 위치에 방벽을 펼칩니다.', en: 'Create a barrier at the target location.' },
    'pummel-nemesis-form': { ko: '주먹을 내질러 전방에 충격파를 보냅니다.', en: 'Punch forward to send out a shockwave.' },
    'ravenous-vortex': { ko: '적을 감속시키고 아래로 끌어당기는 구체를 발사합니다. 다시 눌러 일찍 폭발시킬 수 있습니다.', en: 'Throw a sphere that slows and pulls enemies downward. Activate again to detonate it early.' },
    annihilation: { ko: '네메시스 형태로 바뀌어 주변 적에게 지속 피해를 줍니다. 적에게 피해를 주면 더 오래 유지됩니다.', en: 'Enter Nemesis form and damage nearby enemies over time. Damaging enemies extends the effect.' },
  },
  reinhardt: {
    'rocket-hammer': { ko: '망치를 휘둘러 근접 공격을 합니다.', en: 'Swing a large hammer in melee range.' },
    charge: { ko: '전방으로 돌진하고 붙잡은 적을 벽에 밀어붙입니다.', en: 'Rush forward and pin a caught enemy against a wall.' },
    'fire-strike': { ko: '전방을 향해 불꽃 투사체를 날립니다.', en: 'Send a flaming projectile forward.' },
    'barrier-field': { ko: '전방으로 에너지 방벽을 펼칩니다.', en: 'Deploy an energy shield in front of Reinhardt.' },
    earthshatter: { ko: '전방의 적을 넘어뜨립니다.', en: 'Slam the ground and knock down enemies ahead.' },
  },
  genji: {
    shuriken: { ko: '수리검 세 개를 연달아 던지거나 부채꼴로 흩뿌립니다.', en: 'Throw three shuriken in a burst or fan.' },
    deflect: { ko: '날아오는 투사체를 조준 방향으로 튕겨내고 근접 공격을 막습니다.', en: 'Redirect incoming projectiles toward your aim and block melee strikes.' },
    'swift-strike': { ko: '전방으로 빠르게 돌진하며 지나가는 적에게 피해를 줍니다.', en: 'Dash through enemies to damage them.' },
    dragonblade: { ko: '검을 뽑아 근접 공격을 합니다.', en: 'Draw a sword for close-range slashes.' },
    'cyber-agility': { ko: '벽을 오르고 공중에서 한 번 더 점프할 수 있습니다.', en: 'Climb walls and jump a second time in the air.' },
  },
  kiriko: {
    'healing-ofuda': { ko: '아군을 따라가는 치유 부적을 날립니다.', en: 'Send healing talismans that seek the targeted ally.' },
    kunai: { ko: '원거리에서 사용할 수 있는 쿠나이를 던집니다.', en: 'Throw a kunai projectile at range.' },
    'swift-step': { ko: '아군의 위치로 순간이동합니다.', en: 'Teleport to an ally.' },
    'protection-suzu': { ko: '부적이 닿은 아군에게 잠깐 무적을 부여하고 대부분의 해로운 효과를 제거합니다.', en: 'The charm briefly protects allies from harm and clears most negative effects.' },
    'kitsune-rush': { ko: '여우 영혼이 지나간 경로의 아군은 이동과 공격, 재사용 대기시간 회복이 빨라집니다.', en: 'Allies on the fox spirit’s path move and attack faster and recover cooldowns more quickly.' },
  },
};

export const getAbilitySummary = (heroId: string, abilityId: string, locale: 'ko' | 'en') =>
  summaries[heroId]?.[abilityId]?.[locale];

type PatchReference = { label: string; value: number; unit?: string; patch: string; source: string };

const patchReferences: Record<string, Record<string, PatchReference>> = {
  ana: {
    'biotic-grenade': { label: '폭발 피해', value: 60, patch: '2026-11',
      source: 'https://overwatch.blizzard.com/en-us/news/patch-notes/live/2026/11/' },
  },
  ramattra: {
    'void-accelerator-omnic-form': { label: '탄창', value: 125, patch: '2026-11',
      source: 'https://overwatch.blizzard.com/en-us/news/patch-notes/live/2026/11/' },
    'void-barrier-omnic-form': { label: '재사용 대기시간', value: 13, unit: 's', patch: '2026-07-30',
      source: 'https://overwatch.blizzard.com/en-us/news/patch-notes/live/2026/07/' },
    'ravenous-vortex': { label: '폭발 피해', value: 30, patch: '2026-07-14',
      source: 'https://overwatch.blizzard.com/en-us/news/patch-notes/live/2026/07/' },
  },
};

export const getAbilityPatchReference = (heroId: string, abilityId: string) =>
  patchReferences[heroId]?.[abilityId];

const koreanNames: Record<string, Record<string, string>> = {
  ramattra: {
    'void-accelerator-omnic-form': '공허 가속기 (옴닉 형태)', 'void-barrier-omnic-form': '공허 방벽 (옴닉 형태)',
    'pummel-nemesis-form': '응징 (네메시스 형태)', 'ravenous-vortex': '탐식의 소용돌이', annihilation: '절멸',
  },
  tracer: { 'pulse-pistols': '펄스 쌍권총', blink: '점멸', recall: '시간 역행', 'pulse-bomb': '펄스 폭탄' },
  ana: { 'biotic-rifle': '생체 소총', 'sleep-dart': '수면총', 'biotic-grenade': '생체 수류탄', 'nano-boost': '나노 강화제' },
  reinhardt: { 'rocket-hammer': '로켓 해머', charge: '돌진', 'fire-strike': '화염 강타', 'barrier-field': '방벽 방패', earthshatter: '대지분쇄' },
  genji: { shuriken: '수리검', deflect: '튕겨내기', 'swift-strike': '질풍참', dragonblade: '용검', 'cyber-agility': '사이보그의 날렵함' },
  kiriko: { 'healing-ofuda': '치유의 부적', kunai: '쿠나이', 'swift-step': '순보', 'protection-suzu': '정화의 방울', 'kitsune-rush': '여우길' },
};

export const getKoreanAbilityName = (heroId: string, abilityId: string) => koreanNames[heroId]?.[abilityId];

const iconSlots: Record<string, Record<string, string>> = {
  genji: { shuriken: 'primary', deflect: 'ability_2', 'swift-strike': 'ability_1', dragonblade: 'ultimate', 'cyber-agility': 'passive' },
  kiriko: { 'healing-ofuda': 'primary', kunai: 'secondary', 'swift-step': 'ability_1', 'protection-suzu': 'ability_2', 'kitsune-rush': 'ultimate' },
  reinhardt: { 'rocket-hammer': 'primary', charge: 'ability_1', 'fire-strike': 'ability_2', 'barrier-field': 'secondary', earthshatter: 'ultimate' },
  ramattra: { 'void-accelerator-omnic-form': 'primary', 'void-barrier-omnic-form': 'secondary', 'ravenous-vortex': 'ability_2', annihilation: 'ultimate' },
  ana: { 'biotic-rifle': 'primary', 'sleep-dart': 'ability_1', 'biotic-grenade': 'ability_2', 'nano-boost': 'ultimate' },
  tracer: { 'pulse-pistols': 'primary', blink: 'ability_1', recall: 'ability_2', 'pulse-bomb': 'ultimate' },
};

export const getAbilityIcon = (heroId: string, abilityId: string) => {
  const slot = iconSlots[heroId]?.[abilityId];
  return slot && `https://raw.githubusercontent.com/rolldeep-stepmerrily/watchpoint/bcb50e9690b11533ffbccee81f98455878f0822c/apps/web/public/icons/heroes/${heroId}/abilities/${slot}.png`;
};

export const abilitySourceForLocale = (source: string, locale: 'ko' | 'en') =>
  locale === 'ko' ? source.replace('overwatch.blizzard.com/en-us/', 'overwatch.blizzard.com/ko-kr/') : source;
