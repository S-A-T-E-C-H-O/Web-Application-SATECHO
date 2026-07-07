import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      environment: 'jsdom',
      // @pinia/testing resolves its createSpy from the global `vi`.
      globals: true,
    },
    server: {
      proxy: {
        '/api': {
          target:
            env.BACKEND_API_ORIGIN ||
            'https://agrosafe-back.bluemeadow-4bdb72df.eastus.azurecontainerapps.io',
          changeOrigin: true,
          secure: false,
          timeout: 60000,
          proxyTimeout: 60000,
        },
      },
    },
  }
})
