import { useEffect, useState } from 'react';
import { getCatalog } from '../services/channel.service';

// The platform's channels come from the backend (one adapter file per channel), so screens never hard-code them.
// Until the list arrives (or if it cannot be read) the two original channels are shown, so nothing renders empty.
const FALLBACK = [
  { code: 'email', label: 'Email', needsSubject: true, designable: true, supportsUrl: false, needsConnection: false, priceCodes: [{ code: 'email_own', label: 'Email, your own SMTP', note: 'We only run the queue, retries and tracking.' }, { code: 'email_shared', label: 'Email, shared sender', note: 'Includes the sending itself.' }] },
  { code: 'inapp', label: 'In-app', needsSubject: false, designable: false, supportsUrl: true, needsConnection: false, priceCodes: [{ code: 'inapp', label: 'In-app', note: 'Delivered over the live connection or the inbox.' }] }
];
let cache = null; let pending = null;
const load = () => {
  if (!pending) pending = getCatalog().then((r) => { cache = r.data; return cache; }).catch(() => { pending = null; return FALLBACK; });
  return pending;
};

/** { types, of(code), labelOf(code) }: the channel list for dropdowns, filters, labels and per-channel behaviour. */
export default function useChannelTypes() {
  const [types, setTypes] = useState(cache || FALLBACK);
  useEffect(() => { let alive = true; if (!cache) load().then((t) => { if (alive) setTypes(t); }); return () => { alive = false; }; }, []);
  const of = (code) => types.find((t) => t.code === code) || { code, label: code, needsSubject: false, designable: false, supportsUrl: false, needsConnection: false, priceCodes: [] };
  return { types, of, labelOf: (code) => of(code).label };
}
