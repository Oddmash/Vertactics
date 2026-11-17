import kingsRowPointA from './kings-row-point-a.json';
import { parseMap } from '../domain/map';
import courtyard from './courtyard.json';
import elevationLab from './elevation-lab.json';

export const maps = [parseMap(elevationLab), parseMap(courtyard), parseMap(kingsRowPointA)];
