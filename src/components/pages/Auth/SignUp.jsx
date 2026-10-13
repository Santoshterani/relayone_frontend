import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { TextField, Alert, Link, Box, Checkbox, FormControlLabel, FormHelperText, Typography } from '@mui/material';
import AuthLayout from './AuthLayout';
import useForm, { check, collect } from './useForm';
import { AppFormActions } from '../../common';
import { authService } from '../../../services';

export default function SignUp() {
  const [sentTo, setSentTo] = useState('');
  const form = useForm({ companyName: '', name: '', email: '', password: '', acceptTerms: false }, (v) => collect({
    companyName: check.min(2, 'Company name')(v.companyName), name: check.min(2, 'Your name')(v.name), email: check.email(v.email),
    password: check.password(v.password), acceptTerms: v.acceptTerms ? undefined : 'Please accept the Terms of Service to continue.'
  }));
  const onSubmit = form.submit(async (v) => {
    await authService.signup({ companyName: v.companyName.trim(), name: v.name.trim(), email: v.email.trim(), password: v.password, acceptTerms: v.acceptTerms });
    setSentTo(v.email.trim());
  });

  if (sentTo) {
    return (
      <AuthLayout title="Check your email">
        <Alert severity="success" sx={{ mb: 2 }}>We sent a confirmation link to <b>{sentTo}</b>. It works for 24 hours.</Alert>
        <Typography color="text.secondary">After you confirm, you can sign in and start in the sandbox with a free trial credit.</Typography>
        <Link component={RouterLink} to="/signin" sx={{ display: 'inline-block', mt: 2 }}>Back to sign in</Link>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout title="Create your account" subtitle="Start in the sandbox. No card needed." footer={<>Already have an account? <Link component={RouterLink} to="/signin">Sign in</Link></>}>
      <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'grid', gap: 2 }}>
        {form.formError && <Alert severity="error">{form.formError}</Alert>}
        <TextField label="Company name" autoFocus {...form.field('companyName')} />
        <TextField label="Your name" autoComplete="name" {...form.field('name')} />
        <TextField label="Work email" type="email" autoComplete="email" {...form.field('email')} />
        <TextField label="Password" type="password" autoComplete="new-password" {...form.field('password')} helperText={form.errors.password || 'At least 8 characters with a letter and a number.'} />
        <Box>
          <FormControlLabel control={<Checkbox checked={form.values.acceptTerms} onChange={form.set('acceptTerms')} />} label="I accept the Terms of Service" />
          {form.errors.acceptTerms && <FormHelperText error>{form.errors.acceptTerms}</FormHelperText>}
        </Box>
        <AppFormActions submitLabel="Create account" busy={form.busy} align="stretch" />
      </Box>
    </AuthLayout>
  );
}
