import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: 'https://andjanuardi.github.io/KLIK-PBJ-SIMEULUE/',
  plugins: [react(), tailwindcss()],
})
