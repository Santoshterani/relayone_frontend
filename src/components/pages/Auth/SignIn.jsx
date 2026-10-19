import React, { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Button, Alert, Link, Box } from '@mui/material';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import ForwardToInboxOutlinedIcon from '@mui/icons-material/ForwardToInboxOutlined';
import AppTextField from '../../common/AppTextField';
import AuthLayout from './AuthLayout';
import PasswordField from './PasswordField';
import useForm, { check, collect } from './useForm';
import { AppFormActions } from '../../common';
import { useAppContext, useToast } from '../../../hooks';
import { authService } from '../../../services';

export default function SignIn() {
  const { startSession } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [needsVerify, setNeedsVerify] = useState(false);
  const form = useForm({ email: '', password: '' }, (v) => collect({ email: check.email(v.email), password: check.required('Password')(v.password) }));

  const onSubmit = form.submit(async (v) => {
    setNeedsVerify(false);
    try {
      const { data } = await authService.login({ email: v.email.trim(), password: v.password });
      startSession(data);
      navigate((location.state && location.state.from) || (data.user.isSuperAdmin ? '/overview' : data.user.isStaff ? '/desk' : '/'), { replace: true });
    } catch (err) {
      if (err.status === 403 && /verify|confirm/i.test(err.message)) setNeedsVerify(true);
      throw err;
    }
  });
  const resend = async () => { try { await authService.resendVerification(form.values.email.trim()); toast.success('If that account needs verifying, we sent a new link.'); } catch (e) { toast.error(e.message); } };

  return (
    <AuthLayout title="Sign in" subtitle="Welcome back. Sign in to manage your messaging.">
      <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'grid', gap: 2 }}>
        {form.formError && <Alert severity="error">{form.formError}</Alert>}
        {needsVerify && <Button size="small" startIcon={<ForwardToInboxOutlinedIcon />} onClick={resend}>Send the verification email again</Button>}
        <AppTextField label="Work email" type="email" autoComplete="email" autoFocus {...form.field('email')} />
        <PasswordField label="Password" autoComplete="current-password" {...form.field('password')} />
        <AppFormActions submitLabel="Sign in" submitIcon={<LoginOutlinedIcon />} busy={form.busy} align="stretch" color="secondary" />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', fontSize: 12.5 }}>
        <Link component={RouterLink} to="/forgot-password" fontWeight={600}>Forgot password?</Link>
        <Link component={RouterLink} to="/signup" fontWeight={600}>Create an account</Link>
      </Box>
    </AuthLayout>
  );
}
