// Placeholders are written {like_this}. Same rule as the server (node/src/helpers/templateEngine.js).
const RE = /\{(\w+)\}/g;

export function extractKeys(...texts) {
  const out = [];
  texts.forEach((t) => { if (!t) return; for (const m of String(t).matchAll(RE)) if (!out.includes(m[1])) out.push(m[1]); });
  return out;
}
export const render = (text, values) => String(text || '').replace(RE, (whole, k) => (Object.prototype.hasOwnProperty.call(values, k) && values[k] !== '' ? values[k] : whole));
