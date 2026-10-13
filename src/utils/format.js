export const money = (v, digits = 2) => `$${Number(v || 0).toFixed(digits)}`;
export const money4 = (v) => `$${Number(v || 0).toFixed(4)}`;
export const dateTime = (v) => (v ? new Date(v).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
export const date = (v) => (v ? new Date(v).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '');
