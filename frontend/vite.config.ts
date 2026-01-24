import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Helps OAuth popups (Google) communicate back to the opener.
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
})
