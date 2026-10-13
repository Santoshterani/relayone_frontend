import { get, post, del } from '../utils/apiHandler';
import { API_KEYS } from '../constants';
export const listKeys = () => get(API_KEYS);
export const createKey = (name) => post(API_KEYS, { name });
export const revokeKey = (id) => del(`${API_KEYS}/${id}`);
