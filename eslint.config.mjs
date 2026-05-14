import config from '@lusc/eslint-config';

export default [
	...config,
	{
		rules: {
			'n/no-unsupported-features/node-builtins': 'off',
		},
	},
];
