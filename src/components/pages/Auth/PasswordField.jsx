import React, { useState } from 'react';
import { Button, TextField } from '@mui/material';

/** Password input with a Show / Hide button, as in the approved design. Takes the same props as TextField. */
export default function PasswordField(props) {
  const [show, setShow] = useState(false);
  return (
    <TextField {...props} type={show ? 'text' : 'password'}
      InputProps={{ endAdornment: <Button size="small" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} sx={{ minWidth: 0, px: 1, fontSize: 12 }}>{show ? 'Hide' : 'Show'}</Button> }} />
  );
}
