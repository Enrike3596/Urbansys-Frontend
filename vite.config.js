import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 5173,
    proxy: {
      // Helper para reescribir cookies
      '^/api|^/process-login|^/logout': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        onProxyRes: (proxyRes, req, res) => {
          // Reescribir cualquier Set-Cookie header para eliminar domain restictivo
          const setCookieHeaders = proxyRes.headers['set-cookie']
          if (setCookieHeaders) {
            const newCookies = (Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders])
              .map(cookie => {
                // Remover Domain y Path, agregar SameSite=Lax
                return cookie
                  .split(';')
                  .filter(part => !part.trim().toLowerCase().startsWith('domain='))
                  .join(';') + '; SameSite=Lax; Path=/'
              })
            res.setHeader('set-cookie', newCookies)
          }
        },
      },
    },
  },
})