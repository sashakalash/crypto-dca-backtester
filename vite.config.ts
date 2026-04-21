import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import type { Plugin } from 'vite'

// Inline CSS files smaller than `sizeLimit` bytes directly into the HTML
// to eliminate the render-blocking stylesheet request.
function inlineSmallCss(sizeLimit = 25_000): Plugin {
  return {
    name: 'inline-small-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle: Record<string, any>) {
      const htmlAsset = Object.values(bundle).find(
        (f) => f.type === 'asset' && f.fileName === 'index.html'
      )
      if (!htmlAsset) return

      let html = htmlAsset.source as string

      for (const [name, file] of Object.entries(bundle)) {
        if (file.type !== 'asset' || !name.endsWith('.css')) continue
        const src: string | Uint8Array = file.source
        const css = typeof src === 'string' ? src : Buffer.from(src).toString('utf8')
        if (Buffer.byteLength(css) > sizeLimit) continue

        const basename = name
          .split('/')
          .pop()!
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const re = new RegExp(`<link[^>]+href="/[^"]*${basename}"[^>]*>`, 'i')
        if (re.test(html)) {
          html = html.replace(re, `<style>${css}</style>`)
          delete bundle[name]
        }
      }

      htmlAsset.source = html
    },
  }
}

const VENDOR_CHUNKS: Record<string, string[]> = {
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
  'vendor-utils': ['date-fns', 'zod'],
}

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    inlineSmallCss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    cssMinify: 'lightningcss',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          for (const [chunk, pkgs] of Object.entries(VENDOR_CHUNKS)) {
            if (pkgs.some((pkg) => id.includes(`/node_modules/${pkg}/`))) return chunk
          }
        },
      },
    },
  },
})
