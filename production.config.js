import {glob} from 'node:fs/promises';
import path from 'node:path';

import {CleanWebpackPlugin} from 'clean-webpack-plugin';
import MinimizerPlugin from 'minimizer-webpack-plugin';

import {MetadataPlugin} from './plugins/metadata.ts';

const {dirname} = import.meta;

function r(name) {
	return path.resolve(dirname, name);
}

const entries = {};

for await (const entry of glob('src/**/*.user.ts', {
	cwd: dirname,
})) {
	const outputName = path.relative('src', entry).slice(0, -'.user.ts'.length);
	entries[outputName] = path.join(dirname, entry);
}

const config = (environment = {}) => ({
	resolve: {
		extensions: ['.ts', '.js'],
		extensionAlias: {
			'.js': ['.js', '.ts'],
		},
	},
	mode: 'production',
	context: dirname,
	entry: entries,
	output: {
		path: r('dist'),
		filename: '[name].user.js',
		hashFunction: 'xxhash64',
	},
	plugins:
		'PROD' in environment
			? [new CleanWebpackPlugin(), new MetadataPlugin()]
			: [new MetadataPlugin()],
	cache: {
		type: 'filesystem',
		cacheDirectory: r('.cache'),
		buildDependencies: {
			config: [r(import.meta.filename), r('tsconfig.json')],
		},
	},
	optimization: {
		usedExports: true,
		minimize: 'PROD' in environment,
		minimizer: [
			new MinimizerPlugin({
				terserOptions: {
					format: {
						// Allow ==UserScript== and ==/UserScript==
						// Allow patterns like @version or @run-at
						// Disallow @see, @ts-ignore, @ts-expect-error
						comments:
							/^\s*==\/?UserScript==|^\s*@(?!see|ts-ignore|ts-expect-error)[\w-]/,
					},
				},
			}),
		],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: ['ts-loader'],
			},
			{
				test: /\.wasm$/,
				type: 'asset/bytes',
			},
		],
	},
});

export default config;
