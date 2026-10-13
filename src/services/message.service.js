import { get, post } from '../utils/apiHandler';
import { MESSAGES } from '../constants';
export const listMessages = (params) => get(MESSAGES, params);
export const getMessage = (id) => get(`${MESSAGES}/${id}`);
export const sendTest = (body) => post(`${MESSAGES}/send-test`, body);
