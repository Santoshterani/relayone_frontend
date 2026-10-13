export default function debounce(fn, wait = 300) {
  let t;
  const wrapped = (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  wrapped.cancel = () => clearTimeout(t);
  return wrapped;
}
