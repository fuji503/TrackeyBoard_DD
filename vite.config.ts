import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages はサブパス (/<repo>/) で配信されるため相対パスでビルドする
  base: './',
  plugins: [react(), tailwindcss()],
})
