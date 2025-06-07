// front/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Definir variáveis globais para o browser
    global: 'globalThis',
  },
  server: {
    port: 3000,
    host: true,
    // Configurações de proxy se necessário
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Otimizações
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          icons: ['lucide-react'],
          forms: ['react-hook-form'],
          notifications: ['react-toastify'],
          socket: ['socket.io-client']
        }
      }
    }
  },
  // Variáveis de ambiente
  envPrefix: 'VITE_',
})