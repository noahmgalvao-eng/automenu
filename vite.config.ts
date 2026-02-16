import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@imgly/background-removal-data/dist/*',
          dest: 'imgly' // Isso criará /public/imgly/ com os arquivos wasm/onnx
        }
      ]
    })
  ],
  // Garante que o servidor permita servir arquivos wasm
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
});