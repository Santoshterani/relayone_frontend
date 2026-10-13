import { get } from '../utils/apiHandler';
import { DASHBOARD } from '../constants';
export const getDashboard = () => get(DASHBOARD);
