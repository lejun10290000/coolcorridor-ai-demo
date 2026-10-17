import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Separate review build; production entry/config remain unchanged pending Builder 1.
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'work/campus-map-review-dist', rollupOptions: { input: fileURLToPath(new URL('./campus-map.html', import.meta.url)) } },
})
