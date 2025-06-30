import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/acumatica': {
        target: 'https://istar.privatecloudcorp.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/acumatica/, ''),
        secure: false,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    },
    // Performance optimizations for development server
    hmr: {
      overlay: false, // Disable error overlay for better performance
    },
    // Optimize for faster hot reloads
    watch: {
      usePolling: false,
      interval: 100,
    },
  },
  build: {
    // Performance optimizations for production build
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false, // Disable sourcemaps for better performance
    rollupOptions: {
      output: {
        // Optimize chunk splitting
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
    // Optimize bundle size
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    // Pre-bundle dependencies for faster dev server startup
    include: ['react', 'react-dom'],
    // Exclude dependencies that don't need pre-bundling
    exclude: [],
  },
  // Performance optimizations
  esbuild: {
    // Optimize JSX transformation
    jsx: 'automatic',
  },
  // CSS optimizations
  css: {
    // Enable CSS code splitting
    modules: {
      localsConvention: 'camelCase',
    },
  },
})
