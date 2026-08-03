/*!
 * This file is part of melusc/eth-userscripts, a collection of useful
 * userscripts for ETH students.
 * Copyright (C) 2026, Luca Schnellmann <oss@lusc.ch>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {rm} from 'node:fs/promises';
import path from 'node:path';
import {parseArgs} from 'node:util';

import esbuild from 'esbuild';

import {makeMetadataPlugin} from './plugins/metadata.ts';

const {values: flags} = parseArgs({
	options: {
		watch: {
			short: 'w',
			type: 'boolean',
			default: false,
		},
	},
});

const cwd = path.resolve(import.meta.dirname, '../');

const outdir = 'dist';

try {
	await rm(path.resolve(cwd, outdir), {recursive: true});
} catch (error: unknown) {
	if (
		!(error instanceof Error) ||
		(error as NodeJS.ErrnoException).code !== 'ENOENT'
	) {
		throw error;
	}
}

const esbuildOptions = {
	absWorkingDir: cwd,
	outdir,
	minify: true,
	platform: 'browser',
	entryPoints: ['src/**/*.user.ts'],
	logLevel: 'info',
	bundle: true,
	metafile: true,
	legalComments: 'eof',
	format: 'iife',
	charset: 'utf8',
	write: false,
	loader: {
		'.wasm': 'binary',
	},
	plugins: [
		makeMetadataPlugin({
			cwd,
			outdir,
			metadata: {
				author: 'Luca Schnellmann <oss@lusc.ch>',
				license: 'GPL-3.0-or-later',
				homepageUrl: 'https://github.com/melusc/eth-userscripts',
				resolveUpdateUrl(assetPath) {
					return new URL(assetPath, 'https://userscripts.lusc.ch/eth/');
				},
			},
		}),
	],
} satisfies esbuild.BuildOptions;

if (flags.watch) {
	const context = await esbuild.context(esbuildOptions);
	await context.watch();
} else {
	await esbuild.build(esbuildOptions);
}
