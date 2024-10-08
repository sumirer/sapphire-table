import { defineConfig } from 'dumi';
import * as path from 'path';

export default defineConfig({
  outputPath: 'docs-dist',
  apiParser: {},
  presets: ['@dumijs/preset-vue'],
  vue: {
    checkerOptions: {
      exclude: [/node_modules/, /lib/],
      filterExposed: true,
    },
    tsconfigPath: path.resolve(__dirname, '../packages/sapphire-vue/tsconfig.json'),
  },
  themeConfig: {
    name: 'sapphire-table-doc',
  },
  resolve: {
    // 配置入口文件路径，API 解析将从这里开始
    entryFile: path.resolve(__dirname, '../packages/sapphire-vue/src/index.ts')
  },
});
