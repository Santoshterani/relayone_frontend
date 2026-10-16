/** Open a Blob in a new tab. The tab is opened first, inside the click, so the browser does not block it. */
export async function openBlob(getBlob) {
  const win = window.open('', '_blank');
  try {
    const blob = await getBlob();
    const url = URL.createObjectURL(blob);
    if (win) win.location.href = url; else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (e) { if (win) win.close(); throw e; }
}
/** File -> base64 text without the data: prefix. */
export const readBase64 = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(',')[1] || '');
  r.onerror = () => reject(new Error('Could not read the file.'));
  r.readAsDataURL(file);
});
