import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (
          warning.message.includes('Module level directives cause errors when bundled') &&
          warning.message.includes('"use client"')
        ) {
          return;
        }

        warn(warning);
      },
    },
  },
});
