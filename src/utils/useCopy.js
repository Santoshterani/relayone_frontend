import { useToast } from '../hooks';

/** copy(text, 'API key') puts text on the clipboard and says so. */
export default function useCopy() {
  const toast = useToast();
  return async (text, what = 'Text') => {
    try { await navigator.clipboard.writeText(text); toast.success(`${what} copied.`); } catch (e) { toast.error('Copy failed. Select the text and copy it by hand.'); }
  };
}
