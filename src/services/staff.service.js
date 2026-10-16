import { get, post, put, del } from '../utils/apiHandler';
import { STAFF } from '../constants';
export const list = () => get(STAFF);
export const add = (body) => post(STAFF, body);
export const setPermissions = (id, permissions, isSenior) => put(`${STAFF}/${id}/permissions`, { permissions, ...(typeof isSenior === 'boolean' ? { isSenior } : {}) });
export const teams = (params) => get(`${STAFF}/teams`, params);
export const setTeam = (enterpriseId, userIds) => put(`${STAFF}/teams/${enterpriseId}`, { userIds });
export const resendInvite = (id) => post(`${STAFF}/${id}/resend-invite`);
export const remove = (id) => del(`${STAFF}/${id}`);
