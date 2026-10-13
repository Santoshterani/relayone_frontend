import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { TextField, Alert, Link, Box, Typography } from '@mui/material';
import AuthLayout from './AuthLayout';
import useForm, { check, collect } from './useForm';
import { AppFormActions, AppCircularLoader } from '../../common';
import { useAppContext } from '../../../hooks';
import { authService } from '../../../services';

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { startSession } = useAppContext();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');
  const form = useForm({ name: '', password: '' }, (v) => collect({ name: check.min(2, 'Your name')(v.name), password: check.password(v.password) }));

  useEffect(() => {
    authService.invitationInfo(token).then(({ data }) => { setInfo(data); form.set('name')(data.name || ''); }).catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onSubmit = form.submit(async (v) => {
    const { data } = await authService.acceptInvite({ token, name: v.name.trim(), password: v.password });
    startSession(data);
    navigate('/', { replace: true });
  });

  if (error) return <AuthLayout title="Invitation"><Alert severity="error">{error}</Alert><Link component={RouterLink} to="/signin" sx={{ display: 'inline-block', mt: 2 }}>Go to sign in</Link></AuthLayout>;
  if (!info) return <AuthLayout title="Invitation"><AppCircularLoader /></AuthLayout>;
  return (
    <AuthLayout title="Join your team" subtitle={`You were invited to ${info.enterpriseName} as ${info.roleName}.`}>
      <Typography color="text.secondary" sx={{ mb: 2 }}>{info.email}</Typography>
      <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'grid', gap: 2 }}>
        {form.formError && <Alert severity="error">{form.formError}</Alert>}
        <TextField label="Your name" autoFocus {...form.field('name')} />
        <TextField label="Choose a password" type="password" autoComplete="new-password" {...form.field('password')} helperText={form.errors.password || 'At least 8 characters with a letter and a number.'} />
        <AppFormActions submitLabel="Accept and continue" busy={form.busy} align="stretch" />
      </Box>
    </AuthLayout>
  );
}
