import { get, post, patch, del } from '../utils/apiHandler';
import { TEAM } from '../constants';
export const listTeam = () => get(TEAM);
export const invite = (body) => post(`${TEAM}/invitations`, body);
export const resendInvite = (id) => post(`${TEAM}/${id}/resend-invite`);
export const changeRole = (id, roleId) => patch(`${TEAM}/${id}`, { roleId });
export const removeMember = (id) => del(`${TEAM}/${id}`);
