import { get, put, post, del } from '../utils/apiHandler';
import { CHANNELS, MESSAGES } from '../constants';
export const getChannels = () => get(CHANNELS);
export const saveEmail = (body) => put(`${CHANNELS}/email`, body);
export const verifyEmail = () => post(`${CHANNELS}/email/verify`);
export const testEmail = (to) => post(`${CHANNELS}/email/test`, { to });
export const removeEmail = () => del(`${CHANNELS}/email`);
export const emailUsage = () => get(`${MESSAGES}/email-usage`);
export const saveInapp = (body) => put(`${CHANNELS}/inapp`, body);
