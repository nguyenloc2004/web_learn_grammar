import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  // Đường dẫn tương đối để bản build mở được cả khi không đặt ở thư mục gốc.
  base: './',
  server: { port: 5173 },
});
