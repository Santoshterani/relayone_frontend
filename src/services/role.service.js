import { get, post, put, del } from '../utils/apiHandler';
import { ROLES } from '../constants';
export const listRoles = () => get(ROLES);
export const roleOptions = () => get(`${ROLES}/options`);
export const getCatalog = () => get(`${ROLES}/catalog`);
export const createRole = (body) => post(ROLES, body);
export const updateRole = (id, body) => put(`${ROLES}/${id}`, body);
export const deleteRole = (id) => del(`${ROLES}/${id}`);
