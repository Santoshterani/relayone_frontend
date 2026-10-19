import React, { useId } from 'react';
import { Box, TextField } from '@mui/material';

/**
 * The one input used across the portal: the label sits above the box (bold, small), a red * marks required fields,
 * an "OPTIONAL" tag replaces "(optional)" in the label, and the box has a soft filled look (set in config/theme.js).
 * Takes the same props as MUI TextField (select, multiline, type, helperText, error, children for options, ...).
 * With no `label` it renders a plain box (search and filter fields).
 */
export default function AppTextField({ label, required, optional, id, InputLabelProps, fullWidth = true, sx, ...rest }) {
  const auto = useId();
  if (label === undefined || label === null || label === '') return <TextField id={id} required={required} fullWidth={fullWidth} sx={sx} {...rest} />;
  const fieldId = id || `f${auto.replace(/:/g, '')}`;
  let text = label; let isOptional = !!optional;
  if (typeof label === 'string' && /\s*\(optional\)\s*$/i.test(label)) { text = label.replace(/\s*\(optional\)\s*$/i, ''); isOptional = true; }
  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto', minWidth: 0, ...sx }}>
      <Box component="label" id={`${fieldId}-label`} htmlFor={fieldId} className="rl-flabel" sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75, fontSize: 12, fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}>
        <span>{text}</span>
        {required && <Box component="span" aria-hidden="true" sx={{ color: 'error.main' }}>*</Box>}
        {isOptional && <Box component="span" aria-hidden="true" sx={{ fontSize: 10, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'text.secondary', bgcolor: 'action.hover', px: 0.75, py: 0.125, borderRadius: 0.75 }}>Optional</Box>}
      </Box>
      <TextField id={fieldId} fullWidth hiddenLabel inputProps={{ 'aria-required': required ? 'true' : undefined, ...(rest.inputProps || {}) }} SelectProps={{ labelId: `${fieldId}-label`, ...(rest.SelectProps || {}) }} {...rest} />
    </Box>
  );
}
