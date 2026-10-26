import { get, post, put, del } from '../utils/apiHandler';
import { EVENTS } from '../constants';
export const listEvents = () => get(EVENTS);
export const getEvent = (id) => get(`${EVENTS}/${id}`);
export const createEvent = (body) => post(EVENTS, body);
export const updateEvent = (id, body) => put(`${EVENTS}/${id}`, body);
export const deleteEvent = (id) => del(`${EVENTS}/${id}`);
/** Starts a real popup session with the event's sample data. Returns { id, url }. */
export const testEvent = (id, to) => post(`${EVENTS}/${id}/test`, { to });
