import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), dts()],
	resolve: {
		alias: {
			'@': path.resolve('examples'),
			packages: path.resolve('packages'),
		},
	},
	build: {
		rollupOptions: {
			external: ['react', '@sapphire-table/core'],
		},
		outDir: './lib',
		lib: {
			entry: 'src/index.ts',
			name: 'index',
			fileName: (format) => `index.${format}.js`,
		},
	},
});
