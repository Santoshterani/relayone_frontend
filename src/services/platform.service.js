import { get, post } from '../utils/apiHandler';
import { PLATFORM } from '../constants';
export const overview = () => get(`${PLATFORM}/overview`);
export const listEnterprises = (params) => get(`${PLATFORM}/enterprises`, params);
export const getEnterprise = (id) => get(`${PLATFORM}/enterprises/${id}`);
export const review = (id, decision, note) => post(`${PLATFORM}/enterprises/${id}/review`, { decision, note });
export const suspend = (id) => post(`${PLATFORM}/enterprises/${id}/suspend`);
export const reactivate = (id) => post(`${PLATFORM}/enterprises/${id}/reactivate`);
