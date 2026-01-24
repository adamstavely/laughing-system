import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve';
  
  if (isDev) {
    // Dev mode: serve the example app
    return {
      plugins: [react()],
      root: resolve(__dirname, 'examples/basic'),
      resolve: {
        alias: {
          '@': resolve(__dirname, './src'),
        },
      },
      server: {
        port: 3000,
        strictPort: false, // Allow fallback to next available port if 3000 is taken
      },
    };
  }
  
  // Build mode: build the library
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'ContextualFeedback',
        fileName: 'index',
        formats: ['es'],
      },
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
          // Code splitting for better tree-shaking
          manualChunks: (id) => {
            // Split integrations into separate chunk
            if (id.includes('integrations/')) {
              return 'integrations';
            }
            // Split large dependencies
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) {
                return 'icons';
              }
              if (id.includes('html2canvas')) {
                return 'screenshot';
              }
            }
          },
        },
      },
      target: 'es2015',
      // Enable minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.log in production
        },
      },
      // Generate source maps for debugging
      sourcemap: true,
      // Optimize chunk size warning
      chunkSizeWarningLimit: 1000,
    },
  };
});
