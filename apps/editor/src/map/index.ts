import kingsRowPointA from './kings-row-point-a.json';
import { parseMap } from '../domain/map';
import courtyard from './courtyard.json';
import elevationLab from './elevation-lab.json';
import tidalRelay from './tidal-relay.json';

export const maps = import.meta.env.MODE === 'e2e'
  ? [parseMap(elevationLab), parseMap(courtyard), parseMap(kingsRowPointA), parseMap(tidalRelay)]
  : [parseMap(kingsRowPointA)];
