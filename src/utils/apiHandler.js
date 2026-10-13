import http from './axios';
import { MSG } from '../constants';

/** Error the UI can show: message, server code, field details, http status. */
export class AppError extends Error {
  constructor(message, { code, details, status } = {}) { super(message); this.code = code; this.details = details || []; this.status = status; }
  /** { fieldName: 'message' } for form fields. */
  fieldErrors() { return Object.fromEntries(this.details.filter((d) => d.field).map((d) => [d.field, d.message])); }
}

/** api('post', '/path', { body, params }) -> { data, meta }. Throws AppError. */
export async function api(method, url, { body, params } = {}) {
  try {
    const res = await http.request({ method, url, data: body, params });
    return { data: res.data.data, meta: res.data.meta };
  } catch (err) {
    if (!err.response) throw new AppError(MSG.NETWORK, { code: 'network' });
    const e = err.response.data && err.response.data.error;
    throw new AppError((e && e.message) || MSG.GENERIC, { code: e && e.code, details: e && e.details, status: err.response.status });
  }
}
export const get = (url, params) => api('get', url, { params });
export const post = (url, body) => api('post', url, { body });
export const put = (url, body) => api('put', url, { body });
export const patch = (url, body) => api('patch', url, { body });
export const del = (url) => api('delete', url);
