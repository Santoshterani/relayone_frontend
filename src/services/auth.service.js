import { post, get } from '../utils/apiHandler';
import { AUTH } from '../constants';

export const signup = (body) => post(AUTH.SIGNUP, body);
export const verifyEmail = (token) => post(AUTH.VERIFY, { token });
export const resendVerification = (email) => post(AUTH.RESEND, { email });
export const login = (body) => post(AUTH.LOGIN, body);
export const forgotPassword = (email) => post(AUTH.FORGOT, { email });
export const resetPassword = (token, password) => post(AUTH.RESET, { token, password });
export const invitationInfo = (token) => get(AUTH.INVITATION(token));
export const acceptInvite = (body) => post(AUTH.ACCEPT, body);
