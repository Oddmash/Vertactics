import { mapSchemaVersion, parseMap } from '../domain/map';
import type { MapDefinition, WorldPoint } from '../domain/map';
import owkrCatalogue from '../domain/owkr-catalogue.json';

type SiteName = readonly [ko: string, en: string];

export type MapLocation = {
  id: string;
  name: SiteName;
  point: WorldPoint;
};

const controlStages: Record<string, readonly SiteName[]> = {
  'antarctic-peninsula': [['시추 시설', 'Drilling Rig'], ['쇄빙선', 'Icebreaker'], ['변칙 구역', 'Anomaly']],
  busan: [['시내', 'Downtown'], ['사찰', 'Sanctuary'], ['메카 기지', 'MEKA Base']],
  ilios: [['등대', 'Lighthouse'], ['우물', 'Well'], ['폐허', 'Ruins']],
  'lijiang-tower': [['야시장', 'Night Market'], ['정원', 'Garden'], ['관제 센터', 'Control Center']],
  nepal: [['마을', 'Village'], ['제단', 'Shrine'], ['성소', 'Sanctum']],
  oasis: [['도심', 'City Center'], ['정원', 'Gardens'], ['대학', 'University']],
  samoa: [['해변', 'Beach'], ['시내', 'Downtown'], ['화산', 'Volcano']],
};

const objectives: Record<string, readonly SiteName[]> = {
  hybrid: [['공격 시작 지점', 'Attacker spawn'], ['A 점령 거점', 'Point A'], ['화물 경유지', 'Payload checkpoint'], ['최종 목적지', 'Final delivery']],
  escort: [['화물 시작 지점', 'Payload start'], ['첫 번째 경유지', 'First checkpoint'], ['두 번째 경유지', 'Second checkpoint'], ['최종 목적지', 'Final delivery']],
  push: [['팀 1 시작 지점', 'Team 1 spawn'], ['팀 1 전진 지점', 'Team 1 checkpoint'], ['로봇 중앙 지점', 'Robot start'], ['팀 2 전진 지점', 'Team 2 checkpoint'], ['팀 2 시작 지점', 'Team 2 spawn']],
  flashpoint: [['거점 A', 'Point A'], ['거점 B', 'Point B'], ['거점 C', 'Point C'], ['거점 D', 'Point D'], ['거점 E', 'Point E']],
};

const namedObjectives: Record<string, readonly SiteName[]> = {
  aatlis: [['역', 'Station'], ['정원', 'Garden'], ['마을 중심부', 'Town Centre'], ['시장', 'Bazaar'], ['리조트', 'Resort']],
};

const fractions: Record<string, readonly (readonly [x: number, z: number])[]> = {
  control: [[0.2, 0.5], [0.5, 0.5], [0.8, 0.5]],
  hybrid: [[0.12, 0.72], [0.35, 0.72], [0.61, 0.38], [0.87, 0.38]],
  escort: [[0.12, 0.7], [0.36, 0.56], [0.63, 0.6], [0.87, 0.31]],
  push: [[0.12, 0.68], [0.3, 0.57], [0.5, 0.5], [0.7, 0.43], [0.88, 0.32]],
  flashpoint: [[0.5, 0.5], [0.25, 0.24], [0.74, 0.24], [0.25, 0.76], [0.74, 0.76]],
};

const catalogueById = new Map(owkrCatalogue.maps.map((item) => [item.id, item]));

export const competitiveOverviews = owkrCatalogue.maps.map(({ id, nameKo, nameEn, mode }) => {
  const wide = mode === 'escort' || mode === 'hybrid' || mode === 'push';
  const width = wide ? 108 : 88;
  const depth = wide ? 62 : 72;
  return parseMap({
    schemaVersion: mapSchemaVersion,
    id,
    name: nameKo,
    metadata: { verification: 'unverified' },
    terrain: [{ id: 'overview-board', name: nameEn, kind: 'floor', origin: [-width / 2, -1, -depth / 2], size: [width, 1, depth] }],
  });
});

export const competitiveOverview = (map: MapDefinition) => {
  const entry = catalogueById.get(map.id);
  const board = map.terrain.find(({ id, kind }) => id === 'overview-board' && kind === 'floor');
  if (!entry || !board) return undefined;

  const names = controlStages[entry.id] ?? namedObjectives[entry.id] ?? objectives[entry.mode];
  const layout = fractions[entry.mode];
  if (!names || !layout) return undefined;

  const locations: MapLocation[] = layout.flatMap(([x, z], index) => {
    const name = names[index];
    if (!name) return [];
    return [{
      id: String(index + 1),
      name,
      point: [board.origin[0] + x * board.size[0], board.origin[1] + board.size[1], board.origin[2] + z * board.size[2]],
    }];
  });

  return { entry, locations };
};
