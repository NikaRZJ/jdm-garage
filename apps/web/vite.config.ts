import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Плагин роутера должен стоять раньше плагина React: он генерирует дерево маршрутов из src/routes.
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
  server: {
    port: 5173,
    strictPort: true,
    // В разработке фронт и API на разных портах. Прокси делает их одним источником для браузера:
    // запросы на /api уходят на Nest, и CORS не нужен. В production ту же роль сыграет nginx.
    proxy: {
      '/api': 'http://127.0.0.1:3000',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
