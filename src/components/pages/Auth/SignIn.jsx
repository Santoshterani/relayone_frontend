import React, { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { TextField, Button, Alert, Link, Box } from '@mui/material';
import AuthLayout from './AuthLayout';
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
      navigate((location.state && location.state.from) || (data.user.isSuperAdmin ? '/platform' : '/'), { replace: true });
    } catch (err) {
      if (err.status === 403 && /verify|confirm/i.test(err.message)) setNeedsVerify(true);
      throw err;
    }
  });
  const resend = async () => { try { await authService.resendVerification(form.values.email.trim()); toast.success('If that account needs verifying, we sent a new link.'); } catch (e) { toast.error(e.message); } };

  return (
    <AuthLayout title="Sign in" subtitle="Welcome back." footer={<>New to RelayLite? <Link component={RouterLink} to="/signup">Create an account</Link></>}>
      <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'grid', gap: 2 }}>
        {form.formError && <Alert severity="error">{form.formError}</Alert>}
        {needsVerify && <Button size="small" onClick={resend}>Send the verification email again</Button>}
        <TextField label="Work email" type="email" autoComplete="email" autoFocus {...form.field('email')} />
        <TextField label="Password" type="password" autoComplete="current-password" {...form.field('password')} />
        <Link component={RouterLink} to="/forgot-password" sx={{ justifySelf: 'end' }}>Forgot password?</Link>
        <AppFormActions submitLabel="Sign in" busy={form.busy} align="stretch" />
      </Box>
    </AuthLayout>
  );
}
