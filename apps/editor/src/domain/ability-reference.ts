import officialAbilities from './official-ability-data.json';

type OfficialAbility = { ko: string; descriptionKo: string; descriptionEn: string; icon: string };
const official: Record<string, Record<string, OfficialAbility>> = officialAbilities;

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
  summaries[heroId]?.[abilityId]?.[locale] ?? official[heroId]?.[abilityId]?.[locale === 'ko' ? 'descriptionKo' : 'descriptionEn'];

type Stat = [label: string, value: number | string, unit?: string];
type PatchReference = { patch: string; values: Stat[] };

const august = (...values: Stat[]): PatchReference => ({ patch: '2026-08-11', values });
const augustHotfix = (...values: Stat[]): PatchReference => ({ patch: '2026-08-14', values });
const november = (...values: Stat[]): PatchReference => ({ patch: '2026-11-03', values });
const october = (...values: Stat[]): PatchReference => ({ patch: '2026-10-06', values });
const september = (...values: Stat[]): PatchReference => ({ patch: '2026-09-08', values });
const septemberHotfix = (...values: Stat[]): PatchReference => ({ patch: '2026-09-17', values });
const octoberHotfix = (...values: Stat[]): PatchReference => ({ patch: '2026-10-13', values });

const patchReferences: Record<string, Record<string, PatchReference | PatchReference[]>> = {
  ana: { 'biotic-grenade': november(['폭발 피해', 60]) },
  anran: {
    'zhuque-fans': november(['피해량', 24]),
    'vermillion-ascent': november(['시전 시간', 1, 's']),
    'vermillion-revival': september(['시전 시간', 2.5, 's']),
  },
  baptiste: {
    'immortality-field': september(['최소 생명력 비율', 25, '%'], ['재사용 대기시간', 20, 's'], ['장치 생명력', 150]),
  },
  bastion: { reconfigure: october(['지속시간', 5, 's']) },
  brigitte: { inspire: november(['내부 재사용 대기시간', 1, 's'], ['즉시 치유', 15]) },
  dmon: {
    'plasma-saber': september(['피해량', 60]),
    'portable-fusion-repeater': september(['탄 퍼짐', 1.75, '°'], ['피해 감소 시작 거리', 20, 'm']),
    'surging-strike': augustHotfix(['시전 시간', 0.05, 's'], ['회복 시간', 0.15, 's']),
    'fusion-repeater': [septemberHotfix(['피해량', 15], ['재사용 대기시간', 5, 's']),
      augustHotfix(['시전 시간', 0.2, 's'], ['회복 시간', 0.2, 's'])],
    'call-mech': september(['변신 시간', 0.95, 's']),
    'power-barrier': [november(['회복 시간', 0.3, 's'], ['최소 전개 시간', 0.25, 's']), september(['시전 시간', 0.016, 's'])],
    propulsors: november(['충돌 피해', 0]),
  },
  doctrine: {
    'eternal-scepter': [november(['주 공격 회복 시간', 0.65, 's'], ['주입 피해', 80], ['주입 치유', 110]),
      octoberHotfix(['기본 피해', 55], ['기본 치유', 55])],
    'invigorating-drones': [octoberHotfix(['지속시간', 5, 's']), october(['공격 속도 증가', 30, '%'])],
    'shrouded-momentum': [november(['재사용 대기시간', 10, 's']), october(['받는 피해 감소', 40, '%'])],
    deliverance: october(['추가 생명력·약화 지속시간', 6, 's'], ['감소 지속시간', 4, 's']),
    infuse: november(['재사용 대기시간', 9, 's']),
  },
  domina: {
    'crystal-charge': october(['재사용 대기시간', 7, 's']),
    panopticon: august(['방벽 생명력', 500]),
  },
  doomfist: { 'seismic-slam': august(['피해량', 60]) },
  dva: { 'micro-missiles': october(['초당 발사 수', 14]) },
  emre: { 'cyber-frag': [november(['폭발까지 걸리는 시간', 0.5, 's']), october(['재사용 대기시간', 9, 's'])] },
  freja: { 'take-aim': september(['폭발 피해', 75]) },
  genji: {
    deflect: november(['지속시간', 1.5, 's']),
    'swift-strike': october(['피해량', 60]),
    dragonblade: october(['피해량', 100]),
  },
  illari: {
    'solar-rifle': november(['최대 충전 시간', 0.575, 's']),
    'healing-pylon': november(['투사체당 치유', 50]),
  },
  'jetpack-cat': {
    'biotic-pawjectiles': september(['투사체당 피해', 4], ['투사체당 치유', 4]),
    'frenetic-flight': november(['초당 연료 회복률', 20, '%']),
    lifeline: august(['이동 속도 증가', 30, '%']),
    purr: augustHotfix(['자가 치유 감소', 40, '%']),
  },
  'junker-queen': { carnage: november(['재사용 대기시간', 7, 's']) },
  juno: { 'pulsar-torpedoes': august(['최소 조준 고정 시간', 0.35, 's']) },
  junkrat: { 'concussion-mine': september(['재사용 대기시간', 7, 's']) },
  kiriko: {
    'healing-ofuda': september(['투사체 속도', 18, 'm/s'], ['최대 추적 거리', 30, 'm']),
    'protection-suzu': september(['무적 지속시간', 0.5, 's'], ['폭발 반경', 4, 'm']),
  },
  lifeweaver: { 'life-grip': august(['기본 끌어당김 속도', 25, 'm/s'], ['취소 가능 시점', 0.6, 's']) },
  lucio: { 'sound-barrier': october(['지속시간', 6, 's']) },
  mauga: { overrun: august(['5대5 재사용 대기시간', 6, 's']) },
  mizuki: { 'katashiro-return': august(['재사용 대기시간', 12, 's']) },
  pharah: { 'concussive-blast': august(['재사용 대기시간', 8, 's']) },
  ramattra: {
    'void-accelerator-omnic-form': november(['탄창', 125]),
    'void-barrier-omnic-form': { patch: '2026-07-30', values: [['재사용 대기시간', 13, 's']] },
    'ravenous-vortex': { patch: '2026-07-14', values: [['폭발 피해', 30]] },
  },
  roadhog: {
    'scrap-gun': [octoberHotfix(['중앙 투사체 피해', 40]), october(['탄창', 12],
      ['산탄 개수', 16], ['산탄 1발당 피해', 4.25], ['치명타 배율', 1.5, '×'],
      ['탄 퍼짐', 6, '°'], ['피해 감소 거리', '20–35', 'm'], ['투사체 속도', 100, 'm/s'])],
    'trash-compactor': october(['흡수 지속시간', 2, 's'], ['폭발 피해', '75–200'], ['직격 피해', 10],
      ['폭발 내부 반경', 2, 'm'], ['폭발 외부 반경', 6, 'm'], ['흡수 피해 전환율', 30, '%'],
      ['5대5 재사용 대기시간', 10, 's']),
    'chain-hook': october(['대상 정지 거리', 4.5, 'm'], ['당긴 후 기절 지속시간', 0.3, 's'],
      ['5대5 재사용 대기시간', 6, 's']),
    'take-a-breather': [octoberHotfix(['재사용 대기시간', 1.25, 's'], ['최대 지속시간', 2.5, 's'],
      ['받는 피해 감소', 40, '%']), october(['초당 치유', 200])],
  },
  shion: {
    joyride: august(['지상 발사 감지 반경', 1, 'm']),
    execution: november(['초기 탄 퍼짐', 5.7, '°']),
    'satsuriku-spree': november(['회차별 시전·이동 시간', 0.5, 's']),
  },
  sierra: {
    'helix-rifle': september(['피해량', 8.5], ['투사체 속도', 120, 'm/s']),
    'tracking-shot': september(['피해량', 8.5]),
    'tremor-charge': september(['재사용 대기시간', 7, 's']),
  },
  sombra: {
    'machine-pistol': [octoberHotfix(['투사체당 피해', 6.5]), october(['피해 감소 시작 거리', 20, 'm'],
      ['최대 탄 퍼짐', 2, '°'], ['최대 탄 퍼짐까지 발사 수', 10])],
    hotfix: [november(['지속시간', 10, 's']), october(['즉시 치유', 65], ['초당 치유', 25],
      ['최대 치유', 175], ['사거리', 17, 'm'], ['시전 시간', 0.5, 's'], ['충전 횟수', 2],
      ['재사용 대기시간', 8, 's'], ['해킹 재사용 대기시간', 6, 's'], ['생명력 팩 해킹 지속시간', 30, 's'])],
    translocator: october(['투사체 사거리', 12.25, 'm'], ['은신 지속시간', 6.5, 's'],
      ['은신 진입 시간', 0.75, 's'], ['재사용 대기시간', 7.5, 's']),
    emp: october(['대상 현재 생명력 기준 피해', 20, '%']),
    cyberspace: [november(['약화 효과', 40, '%']), octoberHotfix(['폭발 피해', 20], ['재사용 대기시간', 13, 's']),
      october(['폭발 치유', 40], ['구역 반경', 5, 'm'], ['구역 지속시간', 3, 's'], ['구역 초당 피해', 25], ['구역 초당 치유', 30])],
  },
  symmetra: { teleporter: september(['설치 거리', 25, 'm'], ['순간이동 재사용 대기시간', 1.25, 's']) },
  torbjorn: { 'rivet-gun': september(['보조 공격 탄 퍼짐', 4, '°']) },
  tracer: { recall: august(['재사용 대기시간', 12, 's']) },
  vendetta: {
    'soaring-slice': august(['부활 직후 재사용 대기시간', 3, 's']),
    'palatine-fang': [november(['첫 공격 준비 시간', 0.2, 's']), september(['수평 베기 지속시간', 0.2, 's'], ['연계 입력 시간', 0.9, 's'])],
    'whirlwind-dash': september(['회복 시간', 0.75, 's']),
    'sundering-blade': september(['회복 시간', 0.5, 's']),
  },
  winston: { 'barrier-projector': september(['5대5 재사용 대기시간', 10, 's'], ['지속시간', 7, 's']) },
  wuyang: {
    'restorative-stream': september(['시야 이탈 유예 시간', 3, 's'], ['초당 자원 회복률', 15, '%']),
    'guardian-wave': august(['최대 각도', 15, '°']),
  },
  zarya: { 'particle-barrier': september(['5대5 재사용 대기시간', 12, 's']) },
  zenyatta: { 'orb-of-harmony': september(['시야 이탈 유예 시간', 3, 's']) },
};

export const getAbilityPatchReferences = (heroId: string, abilityId: string) => {
  const hero = Object.hasOwn(patchReferences, heroId) ? patchReferences[heroId] : undefined;
  const reference = hero && Object.hasOwn(hero, abilityId) ? hero[abilityId] : undefined;
  if (!reference) return [];
  return (Array.isArray(reference) ? reference : [reference]).map((entry) => {
    const monthPath = entry.patch.slice(0, 7).replace('-', '/');
    return { ...entry, source: `https://overwatch.blizzard.com/en-us/news/patch-notes/live/${monthPath}/#patch-${entry.patch}` };
  });
};
export const getKoreanAbilityName = (heroId: string, abilityId: string) => official[heroId]?.[abilityId]?.ko;

export const getAbilityIcon = (heroId: string, abilityId: string) => {
  const source = official[heroId]?.[abilityId]?.icon;
  return source && `images/abilities/${source.slice(source.lastIndexOf('/') + 1, -4)}.webp`;
};

export const abilitySourceForLocale = (source: string, locale: 'ko' | 'en') =>
  locale === 'ko' ? source.replace(/overwatch\.blizzard\.com\/(?:en-us\/|en-gb\/)?/, 'overwatch.blizzard.com/ko-kr/') : source;
