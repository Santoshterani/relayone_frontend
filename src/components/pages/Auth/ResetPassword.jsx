import React from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { TextField, Alert, Link, Box } from '@mui/material';
import AuthLayout from './AuthLayout';
import useForm, { check, collect } from './useForm';
import { AppFormActions } from '../../common';
import { useToast } from '../../../hooks';
import { authService } from '../../../services';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const form = useForm({ password: '', confirm: '' }, (v) => collect({ password: check.password(v.password), confirm: v.confirm !== v.password ? 'The passwords do not match.' : undefined }));
  const onSubmit = form.submit(async (v) => {
    await authService.resetPassword(params.get('token') || '', v.password);
    toast.success('Password updated. Sign in with the new password.');
    navigate('/signin', { replace: true });
  });
  return (
    <AuthLayout title="Choose a new password" footer={<Link component={RouterLink} to="/forgot-password">Need a new link?</Link>}>
      <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'grid', gap: 2 }}>
        {form.formError && <Alert severity="error">{form.formError}</Alert>}
        <TextField label="New password" type="password" autoComplete="new-password" autoFocus {...form.field('password')} helperText={form.errors.password || 'At least 8 characters with a letter and a number.'} />
        <TextField label="Repeat password" type="password" autoComplete="new-password" {...form.field('confirm')} />
        <AppFormActions submitLabel="Update password" busy={form.busy} align="stretch" />
      </Box>
    </AuthLayout>
  );
}
