import { get, put, post } from '../utils/apiHandler';
import { ENTERPRISE } from '../constants';
export const getEnterprise = () => get(ENTERPRISE.ROOT);
export const saveProfile = (body) => put(ENTERPRISE.PROFILE, body);
export const submitForReview = () => post(ENTERPRISE.SUBMIT);
