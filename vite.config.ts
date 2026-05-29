import { defineConfig } from 'vite'

// Slidev merges this. When hosting the live server (Render etc.), Vite's dev server
// rejects unknown Host headers unless they're allow-listed.
export default defineConfig({
  server: {
    host: true, // bind 0.0.0.0 so the host platform can reach it
    allowedHosts: ['.onrender.com', '.koyeb.app', '.fly.dev', 'localhost'],
  },
})
