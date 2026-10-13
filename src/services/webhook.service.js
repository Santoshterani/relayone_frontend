import { get, post, put, del } from '../utils/apiHandler';
import { WEBHOOKS } from '../constants';
export const listWebhooks = () => get(WEBHOOKS);
export const createWebhook = (url) => post(WEBHOOKS, { url });
export const setActive = (id, active) => put(`${WEBHOOKS}/${id}/active`, { active });
export const deleteWebhook = (id) => del(`${WEBHOOKS}/${id}`);
export const listDeliveries = (params) => get(`${WEBHOOKS}/deliveries`, params);
