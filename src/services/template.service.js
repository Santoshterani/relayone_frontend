import { get, post, put, del } from '../utils/apiHandler';
import { TEMPLATES } from '../constants';
export const listTemplates = (channel) => get(TEMPLATES, channel ? { channel } : undefined);
export const getTemplate = (id) => get(`${TEMPLATES}/${id}`);
export const createTemplate = (body) => post(TEMPLATES, body);
export const updateTemplate = (id, body) => put(`${TEMPLATES}/${id}`, body);
export const savePlaceholders = (id, placeholders) => put(`${TEMPLATES}/${id}/placeholders`, { placeholders });
export const deleteTemplate = (id) => del(`${TEMPLATES}/${id}`);
