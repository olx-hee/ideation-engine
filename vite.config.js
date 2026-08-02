import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // 개발 중 프론트(/api/*) 요청을 백엔드 Express(3001)로 전달
      '/api': 'http://localhost:3001',
    },
  },
})
