import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: false,
      dirs: ['./src/composables', './src/stores'],
    }),
    Components({
      dirs: ['./src/components'],
      deep: true,
      dts: false,
    }),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3001,
    strictPort: true,
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
    modulePreload: {
      polyfill: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) return 'vendor-3d'
            if (id.includes('chart.js') || id.includes('vue-chartjs')) return 'vendor-charts'
            if (id.includes('mermaid')) return 'vendor-mermaid'
            if (id.includes('face-api') || id.includes('@tensorflow')) return 'vendor-ml'
            if (id.includes('katex') || id.includes('marked') || id.includes('highlight.js')) return 'vendor-editor'
            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) return 'vendor-vue'
            if (id.includes('gsap') || id.includes('lenis') || id.includes('motion') || id.includes('@vueuse/motion')) return 'vendor-animation'
            if (id.includes('lucide-vue-next') || id.includes('@neoconfetti')) return 'vendor-icons'
            if (id.includes('jsqr')) return 'vendor-qr'
            if (id.includes('axios')) return 'vendor-http'
            if (id.includes('luxon')) return 'vendor-date'
            return 'vendor-other'
          }
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (info) => {
          const ext = info.name.split('.').pop()
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) return `assets/img/[name]-[hash].${ext}`
          if (/woff2?|ttf|eot/i.test(ext)) return `assets/fonts/[name]-[hash].${ext}`
          if (ext === 'css') return 'assets/css/[name]-[hash].css'
          return `assets/[name]-[hash].${ext}`
        },
      },
    },
    chunkSizeWarningLimit: 500,
    reportCompressedSize: true,
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none',
  },
}))
