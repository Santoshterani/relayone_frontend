import { get, post, put, del } from '../utils/apiHandler';
import { STAFF } from '../constants';
export const list = () => get(STAFF);
export const add = (body) => post(STAFF, body);
export const setPermissions = (id, permissions) => put(`${STAFF}/${id}/permissions`, { permissions });
export const resendInvite = (id) => post(`${STAFF}/${id}/resend-invite`);
export const remove = (id) => del(`${STAFF}/${id}`);
