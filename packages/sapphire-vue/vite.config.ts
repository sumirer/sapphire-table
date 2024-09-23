import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import dts from 'vite-plugin-dts';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue(), vueJsx(), dts()],
	resolve: {
		alias: {
			'@': path.resolve('examples'),
			packages: path.resolve('packages'),
		},
	},
	build: {
		rollupOptions: {
			// 请确保外部化那些你的库中不需要的依赖
			external: ['vue', '@sapphire-table/core'],
			// output: {
			// 	// 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
			// 	globals: {
			// 		vue: 'Vue',
			// 	},
			// },
		},
		outDir: './lib',
		lib: {
			entry: 'src/index.ts',
			name: 'index',
			fileName: (format) => `index.${format}.js`,
		},
	},
});
