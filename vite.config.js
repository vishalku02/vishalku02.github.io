import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        coralIndex: resolve(__dirname, 'coral/index.html'),
        coralIntro: resolve(__dirname, 'coral/intro.html'),
        coralJuxtaposition: resolve(__dirname, 'coral/juxtaposition.html'),
        coralEnding: resolve(__dirname, 'coral/ending.html'),
        coralClosing: resolve(__dirname, 'coral/closing.html'),
      }
    }
  }
})
