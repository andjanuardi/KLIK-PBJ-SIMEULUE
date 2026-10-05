import { Navigate, useParams } from "react-router-dom";

/**
 * Detail publik dinonaktifkan demi privasi: selalu arahkan ke Lacak agar
 * setiap pembuka tiket wajib verifikasi 4 digit WA/NIK. Kode dari URL
 * diteruskan sebagai prefill (`/lacak?kode=...`).
 */
export default function Detail() {
  const { kode } = useParams();
  return <Navigate to={`/lacak${kode ? `?kode=${encodeURIComponent(kode)}` : ""}`} replace />;
}
