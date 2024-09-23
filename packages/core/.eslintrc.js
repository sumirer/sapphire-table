module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
		'plugin:prettier/recommended',
		'plugin:@typescript-eslint/recommended',
	],
	plugins: ['react', '@typescript-eslint'],
	parser: '@typescript-eslint/parser',
	rules: {
		'react/jsx-uses-react': 'off',
		'react/react-in-jsx-scope': 'off',
		'react/jsx-key': ['error'],
		'import/first': 'off',
		'@typescript-eslint/no-namespace': 'off',
		'@typescript-eslint/no-var-requires': 'off',
		'@typescript-eslint/consistent-type-imports': 'error',
	},
};
