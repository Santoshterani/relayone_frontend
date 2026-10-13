// Small client logger. Errors are always printed; debug only in development.
const dev = import.meta.env.DEV;
export default {
  debug: (...a) => { if (dev) console.debug('[relaylite]', ...a); },
  info: (...a) => console.info('[relaylite]', ...a),
  warn: (...a) => console.warn('[relaylite]', ...a),
  error: (...a) => console.error('[relaylite]', ...a)
};
