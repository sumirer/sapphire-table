module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
		'plugin:prettier/recommended',
		'plugin:@typescript-eslint/recommended',
	],
	plugins: ['@typescript-eslint'],
	parser: '@typescript-eslint/parser',
	rules: {
		'import/first': 'off',
		'@typescript-eslint/no-namespace': 'off',
		'@typescript-eslint/no-var-requires': 'off',
		'@typescript-eslint/consistent-type-imports': 'error',
	},
};
