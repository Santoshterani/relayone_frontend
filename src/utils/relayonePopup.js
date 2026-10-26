import { BASE_URL } from '../config';

let loading = null;
const loadScript = () => {
  if (window.RelayOne && window.RelayOne.open) return Promise.resolve();
  if (!loading) loading = new Promise((resolve, reject) => {
    const s = document.createElement('script'); s.src = `${BASE_URL}/widget/relayone-ui.js`; s.async = true;
    s.onload = resolve; s.onerror = () => { loading = null; reject(new Error('Could not load the popup from RelayOne. Check that the API address is reachable.')); };
    document.head.appendChild(s);
  });
  return loading;
};

/** Opens the same RelayOne popup that a customer's website shows, for a session made by the portal (Send a test). */
export async function openPopup({ session, onSuccess, onClose }) {
  await loadScript();
  return window.RelayOne.open({ session, apiUrl: BASE_URL, onSuccess, onClose });
}
