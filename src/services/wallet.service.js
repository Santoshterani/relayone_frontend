import { get, post, put } from '../utils/apiHandler';
import { WALLET } from '../constants';
export const getWallet = () => get(WALLET);
export const listTransactions = (params) => get(`${WALLET}/transactions`, params);
export const topUp = (amount) => post(`${WALLET}/topup`, { amount });
export const setThreshold = (threshold) => put(`${WALLET}/threshold`, { threshold });
// Super Admin: per-message price list.
export const getPrices = () => get(`${WALLET}/prices`);
export const setPrice = (code, price) => put(`${WALLET}/prices/${code}`, { price });
