import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Cloudflare Pages serve na raiz ('/'); GitHub Pages serve em '/Rpg-Table/'
const base = process.env.VITE_BASE_PATH || (process.env.GITHUB_ACTIONS ? '/Rpg-Table/' : '/');

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base,
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          konva: ['konva', 'react-konva'],
          motion: ['motion'],
        },
      },
    },
  },
});
