import React, { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Link, CircularProgress, Box } from '@mui/material';
import AuthLayout from './AuthLayout';
import { useAppContext } from '../../../hooks';
import { authService } from '../../../services';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const { startSession } = useAppContext();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return; ran.current = true; // the link works once, so never call twice
    authService.verifyEmail(params.get('token') || '')
      .then(({ data }) => { startSession(data); navigate('/', { replace: true }); })
      .catch((e) => setError(e.message));
  }, [params, startSession, navigate]);

  return (
    <AuthLayout title="Confirming your email">
      {error ? <><Alert severity="error">{error}</Alert><Link component={RouterLink} to="/signin" sx={{ display: 'inline-block', mt: 2 }}>Go to sign in</Link> to request a new link.</>
        : <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={26} /></Box>}
    </AuthLayout>
  );
}
