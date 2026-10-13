import { useState } from 'react';
import rules from '../../../api/getValidations';

/** Small form helper: values, field errors, a submit wrapper that maps server errors to fields. */
export default function useForm(initial, validate) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (name) => (e) => { const v = e && e.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e; setValues((s) => ({ ...s, [name]: v })); setErrors((s) => ({ ...s, [name]: undefined })); };
  const field = (name) => ({ value: values[name], onChange: set(name), error: !!errors[name], helperText: errors[name] });

  const submit = (fn) => async (e) => {
    e.preventDefault();
    setFormError('');
    const found = validate ? validate(values) : {};
    if (Object.keys(found).length) { setErrors(found); return; }
    setBusy(true);
    try { await fn(values); } catch (err) {
      const fe = err.fieldErrors ? err.fieldErrors() : {};
      const mapped = Object.fromEntries(Object.entries(fe).map(([k, m]) => [k, m]));
      if (Object.keys(mapped).length > 1 || (Object.keys(mapped).length === 1 && Object.keys(values).includes(Object.keys(mapped)[0]))) setErrors(mapped);
      else setFormError(err.message);
      if (Object.keys(mapped).length > 1) setFormError('');
    } finally { setBusy(false); }
  };
  return { values, errors, formError, busy, field, set, submit, setFormError };
}

export const check = {
  email: (v) => (!rules.email.pattern.test(String(v || '').trim()) ? rules.email.hint : undefined),
  password: (v) => (!rules.password.pattern.test(String(v || '')) ? rules.password.hint : undefined),
  min: (n, label) => (v) => (String(v || '').trim().length < n ? `${label} must be at least ${n} characters.` : undefined),
  required: (label) => (v) => (!String(v || '').trim() ? `${label} is required.` : undefined)
};
export const collect = (map) => Object.fromEntries(Object.entries(map).filter(([, m]) => m));
