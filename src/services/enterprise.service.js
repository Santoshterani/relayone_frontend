import { get, put, post } from '../utils/apiHandler';
import http from '../utils/axios';
import { ENTERPRISE } from '../constants';
export const getEnterprise = () => get(ENTERPRISE.ROOT);
export const saveProfile = (body) => put(ENTERPRISE.PROFILE, body);
export const submitForReview = () => post(ENTERPRISE.SUBMIT);
export const listDocuments = () => get(`${ENTERPRISE.ROOT}/documents`);
export const uploadDocument = (type, body) => post(`${ENTERPRISE.ROOT}/documents/${type}`, body);
/** The file as a Blob (needs the sign-in token, so it cannot be a plain link). */
export const documentFile = async (type) => (await http.get(`${ENTERPRISE.ROOT}/documents/${type}/file`, { responseType: 'blob' })).data;
