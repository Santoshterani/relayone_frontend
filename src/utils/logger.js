// Small client logger. Errors are always printed; debug only in development.
const dev = import.meta.env.DEV;
export default {
  debug: (...a) => { if (dev) console.debug('[relayone]', ...a); },
  info: (...a) => console.info('[relayone]', ...a),
  warn: (...a) => console.warn('[relayone]', ...a),
  error: (...a) => console.error('[relayone]', ...a)
};
