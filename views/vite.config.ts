import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { config as dotenvConfig } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Load root .env if present to centralize environment variables
const rootEnv = resolve(__dirname, '..', '.env');
if (existsSync(rootEnv)) {
  dotenvConfig({ path: rootEnv });
}

// https://vitejs.dev/config/
 function debugPlugin() {
   return {
     name: 'debug-log-main',
     enforce: 'pre' as const,
     transform(code: string, id: string) {
       if (id.endsWith('src/main.tsx')) {
         console.log('[vite debug] transforming main.tsx length=', code.length);
       }
       return code;
     }
   };
 }

export default defineConfig({
  plugins: [react()],
   resolve: {
     alias: {
       '@': resolve(__dirname, 'src'),
     },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // bind to all network interfaces so dev server is accessible from other devices on the same LAN
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
