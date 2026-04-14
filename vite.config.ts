import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-recharts': ['recharts'],
          'vendor-d3': [
            'd3-selection',
            'd3-scale',
            'd3-array',
            'd3-shape',
            'd3-axis',
            'd3-scale-chromatic',
          ],
          'vendor-charts': ['lightweight-charts'],
          'vendor-ui': ['lucide-react'],
        },
      },
    },
  },
})
