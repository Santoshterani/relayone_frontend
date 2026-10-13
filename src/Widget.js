import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './config/theme';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';

/** Shell: theme + top level error boundary. */
export default function Widget() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary name="app"><App /></ErrorBoundary>
    </ThemeProvider>
  );
}
