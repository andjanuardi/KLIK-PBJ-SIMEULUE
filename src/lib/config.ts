/** URL Web App Apps Script (Deploy > New deployment > Web app).
 *  Bisa dioverride via env: VITE_KLIKBJB_API_URL */
export const API_URL: string =
  import.meta.env.VITE_KLIKBJB_API_URL ??
  "https://script.google.com/macros/s/AKfycbzrZCw3-fz8mCXSBAOFobe-lTTfwc92jPfi_USY4yQZAz23Wffh4DizhI6R_woANaySRg/exec";
