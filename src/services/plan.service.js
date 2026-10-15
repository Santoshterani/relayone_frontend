import { get, post, put } from '../utils/apiHandler';
import { PLANS, PLATFORM_PLANS } from '../constants';
// Enterprise: plans on sale, my buckets, buy one.
export const mine = () => get(PLANS);
// Super Admin: manage plans.
export const listAll = () => get(PLATFORM_PLANS);
export const create = (body) => post(PLATFORM_PLANS, body);
export const update = (id, body) => put(`${PLATFORM_PLANS}/${id}`, body);
