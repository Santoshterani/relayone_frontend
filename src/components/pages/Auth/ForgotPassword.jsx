import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { TextField, Alert, Link, Box } from '@mui/material';
import AuthLayout from './AuthLayout';
import useForm, { check, collect } from './useForm';
import { AppFormActions } from '../../common';
import { authService } from '../../../services';

export default function ForgotPassword() {
  const [done, setDone] = useState(false);
  const form = useForm({ email: '' }, (v) => collect({ email: check.email(v.email) }));
  const onSubmit = form.submit(async (v) => { await authService.forgotPassword(v.email.trim()); setDone(true); });
  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we will send a link." footer={<Link component={RouterLink} to="/signin">Back to sign in</Link>}>
      {done ? <Alert severity="success">If an account exists for that email, a reset link is on its way. It works for 1 hour.</Alert> : (
        <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'grid', gap: 2 }}>
          {form.formError && <Alert severity="error">{form.formError}</Alert>}
          <TextField label="Work email" type="email" autoFocus {...form.field('email')} />
          <AppFormActions submitLabel="Send reset link" busy={form.busy} align="stretch" />
        </Box>
      )}
    </AuthLayout>
  );
}
