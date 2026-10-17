import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Separate review build; never changes the production entry or its dist directory.
export default defineConfig({plugins:[react()],build:{outDir:'work/dynamic-routing-review',rollupOptions:{input:'review/dynamic-routing.html'}},server:{host:'127.0.0.1',port:4181,strictPort:true},preview:{host:'127.0.0.1',port:4181,strictPort:true}})
