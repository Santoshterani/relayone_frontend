import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

const ToastContext = createContext(null);
/** const toast = useToast(); toast.success('Saved'); toast.error('Failed'); */
export const useToast = () => { const c = useContext(ToastContext); if (!c) throw new Error('useToast needs ToastProvider'); return c; };

export default function ToastProvider({ children }) {
  const [item, setItem] = useState(null);
  const show = useCallback((severity) => (message) => setItem({ severity, message, key: Date.now() }), []);
  const api = useMemo(() => ({ success: show('success'), error: show('error'), info: show('info'), warning: show('warning') }), [show]);
  return (
    <ToastContext.Provider value={api}>
      {children}
      <Snackbar key={item && item.key} open={!!item} autoHideDuration={4500} onClose={() => setItem(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {item ? <Alert severity={item.severity} variant="filled" onClose={() => setItem(null)} sx={{ minWidth: 260 }}>{item.message}</Alert> : undefined}
      </Snackbar>
    </ToastContext.Provider>
  );
}
