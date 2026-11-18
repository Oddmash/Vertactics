import { readFileSync } from 'node:fs';
import { isWorldPoint, parseMap } from '../apps/editor/src/domain/map.ts';
import { measureSegment } from '../apps/editor/src/domain/measurement.ts';

const requiredKingRowsChecks = [
  'main-arch-width', 'main-arch-height', 'hotel-entry-width', 'hotel-bypass-length',
  'attack-balcony-rise', 'defense-balcony-rise',
];

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const validPair = (points) => Array.isArray(points) && points.length === 2 && points.every(isWorldPoint);
const positive = (value) => Number.isFinite(value) && value > 0;

try {
  const [mapFile, surveyFile] = process.argv.slice(2);
  if (!mapFile || !surveyFile) throw new Error('Usage: node scripts/check-map-survey.mjs <map.json> <survey.json>');
  const map = parseMap(readJson(mapFile));
  const survey = readJson(surveyFile);
  if (survey?.mapId !== map.id || !isText(survey.gameBuild) || !isText(survey.variant) ||
    !isText(survey.scaleReference) || !positive(survey.gameUnitsPerEditorUnit) ||
    !positive(survey.tolerance) || !Array.isArray(survey.segments) || !survey.segments.length) {
    throw new Error('Provide a matching map ID, game build, variant, independent scale reference, scale, tolerance and measurements.');
  }

  const seen = new Set();
  const rows = survey.segments.map((entry) => {
    if (!isText(entry?.id) || seen.has(entry.id) || !validPair(entry.editor) || !validPair(entry.game)) {
      throw new Error('Each measurement needs a unique ID and two finite [X, Y, Z] points for each build.');
    }
    seen.add(entry.id);
    const editor = measureSegment(...entry.editor);
    const game = measureSegment(...entry.game);
    const horizontalError = Math.abs(editor.horizontal * survey.gameUnitsPerEditorUnit - game.horizontal);
    const riseError = Math.abs(editor.rise * survey.gameUnitsPerEditorUnit - game.rise);
    if (![horizontalError, riseError].every(Number.isFinite)) throw new Error(`Measurement overflow for ${entry.id}.`);
    return {
      id: entry.id, horizontalError, riseError,
      withinTolerance: Math.max(horizontalError, riseError) <= survey.tolerance,
    };
  });
  const missing = map.id === 'kings-row-a' ? requiredKingRowsChecks.filter((id) => !seen.has(id)) : [];
  console.log(`${map.id} · ${survey.gameBuild} · ${survey.variant}`);
  console.table(rows);
  if (missing.length) console.error(`Missing measurements: ${missing.join(', ')}`);
  if (missing.length || rows.some(({ withinTolerance }) => !withinTolerance)) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
