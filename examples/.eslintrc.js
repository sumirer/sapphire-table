module.exports = {
	root: true,
	env: {
		browser: true,
		es2021: true,
		node: true,
	},
	parser: 'vue-eslint-parser',
	parserOptions: {
		ecmaVersion: 12,
		parser: '@typescript-eslint/parser',
		sourceType: 'module',
	},
	extends: [
		'plugin:vue/vue3-essential',
		'eslint:recommended',
		'plugin:prettier/recommended',
		'plugin:@typescript-eslint/recommended',
	],
	plugins: ['vue', '@typescript-eslint'],
	rules: {
		'@typescript-eslint/no-namespace': 'off',
		'no-useless-escape': 'off',
		'vue/valid-v-for': 'off',
	},
};
