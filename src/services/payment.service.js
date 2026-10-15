import { get, post } from '../utils/apiHandler';
import { PAYMENTS } from '../constants';
export const getConfig = () => get(`${PAYMENTS}/config`);
export const createOrder = (body) => post(`${PAYMENTS}/orders`, body);
export const verify = (body) => post(`${PAYMENTS}/verify`, body);
