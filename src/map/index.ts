import { parseMap } from '../domain/map';
import elevationLab from './elevation-lab.json';

export const sampleMap = parseMap(elevationLab);
