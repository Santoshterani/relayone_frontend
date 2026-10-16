import { get, post } from '../utils/apiHandler';
import { TICKETS, SUPPORT } from '../constants';
// Enterprise side
export const listMine = (params) => get(TICKETS, params);
export const summaryMine = () => get(`${TICKETS}/summary`);
export const myTeam = () => get(`${TICKETS}/team`);
export const create = (body) => post(TICKETS, body);
export const getMine = (id) => get(`${TICKETS}/${id}`);
export const replyMine = (id, body) => post(`${TICKETS}/${id}/reply`, { body });
export const closeMine = (id) => post(`${TICKETS}/${id}/close`);
// Support desk (staff and Super Admin)
export const summary = () => get(`${SUPPORT}/summary`);
export const agents = () => get(`${SUPPORT}/agents`);
export const list = (params) => get(`${SUPPORT}/tickets`, params);
export const getOne = (id) => get(`${SUPPORT}/tickets/${id}`);
export const reply = (id, body, internal) => post(`${SUPPORT}/tickets/${id}/reply`, { body, internal });
export const assign = (id, assigneeId) => post(`${SUPPORT}/tickets/${id}/assign`, { assigneeId });
export const resolve = (id, note) => post(`${SUPPORT}/tickets/${id}/resolve`, { note });
export const escalate = (id, reason) => post(`${SUPPORT}/tickets/${id}/escalate`, { reason });
export const reopen = (id) => post(`${SUPPORT}/tickets/${id}/reopen`);
export const close = (id) => post(`${SUPPORT}/tickets/${id}/close`);
