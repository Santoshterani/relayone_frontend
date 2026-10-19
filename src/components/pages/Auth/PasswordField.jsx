import React, { useState } from 'react';
import { IconButton, InputAdornment } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import AppTextField from '../../common/AppTextField';

/** Password input with a Show / Hide button, as in the approved design. Takes the same props as TextField. */
export default function PasswordField(props) {
  const [show, setShow] = useState(false);
  return (
    <AppTextField {...props} type={show ? 'text' : 'password'}
      InputProps={{ endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} edge="end">{show ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}</IconButton></InputAdornment> }} />
  );
}
