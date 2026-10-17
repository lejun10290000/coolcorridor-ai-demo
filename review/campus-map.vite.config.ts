import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Separate component review build; production entry/config remain unchanged.
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'work/campus-map-review-dist', rollupOptions: { input: fileURLToPath(new URL('./campus-map.html', import.meta.url)) } },
})
