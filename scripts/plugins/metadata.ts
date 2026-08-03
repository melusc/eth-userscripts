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

import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

import esbuild from 'esbuild';

const collator = new Intl.Collator('en-GB', {
	numeric: true,
});

class MetadataParser {
	#kv = new Map<string, string[]>();

	constructor(metadata: string[], assetName: string) {
		for (let line of metadata) {
			line = line.trim();
			const [key_, ...value] = line.split(/\s+/);
			if (!key_ || !key_.startsWith('@')) {
				throw new Error(`Malformed metadata ${line} in ${assetName}`);
			}

			const key = key_.slice(1);

			if (this.#kv.has(key)) {
				this.#kv.get(key)!.push(value.join(' '));
			} else {
				this.#kv.set(key, [value.join(' ')]);
			}
		}
	}

	hasKey(key: string): boolean {
		return this.#kv.has(key);
	}

	getKey(key: string): string[] | undefined {
		return this.#kv.get(key);
	}

	clearKey(key: string): void {
		this.#kv.delete(key);
	}

	setKey(key: string, value: string): void {
		this.#kv.set(key, [value]);
	}

	addKey(key: string, value: string): void {
		if (this.#kv.has(key)) {
			this.#kv.get(key)!.push(value);
		} else {
			this.#kv.set(key, [value]);
		}
	}

	stringify(): readonly string[] {
		return this.#kv
			.entries()
			.flatMap(([key, valueArray]) =>
				valueArray.map(value => (value ? `@${key} ${value}` : `@${key}`)),
			)
			.toArray()
			.toSorted(collator.compare);
	}
}

// https://violentmonkey.github.io/api/
const grantMatchers =
	/\bGM_(?:info|cookie|getValues?|setValues?|deleteValues?|listValues|addValueChangeListener|removeValueChangeListener|getResourceText|getResourceURL|addElement|addStyle|openInTab|registerMenuCommand|unregisterMenuCommand|notification|setClipboard|xmlhttpRequest)\b|\bGM\.(?:addStyle|addElement|cookie|registerMenuCommand|deleteValues?|download|getResourceUrl|getValues?|info|listValues|notification|openInTab|setClipboard|setValues?|xmlHttpRequest)\b|\bwindow\.(?:close|focus)\b|\bunsafeWindow\b/g;

function resolveGrants(source: string): ReadonlySet<string> {
	const matches = source.matchAll(grantMatchers);
	const grants = [...matches].map(s => s[0]);

	return new Set(grants);
}

type MetadataConfig = {
	readonly author: string;
	readonly homepageUrl: string;
	readonly license: string;
	resolveUpdateUrl(assetPath: string): URL;
};

function enhanceMetadata(
	metadata: MetadataParser,
	source: string,
	outputPath: string,
	outdir: string,
	metadataConfig: MetadataConfig,
): void {
	const grants = resolveGrants(source);

	if (grants.size > 0) {
		metadata.clearKey('grant');

		for (const grant of grants) {
			metadata.addKey('grant', grant);
		}
	} else {
		metadata.setKey('grant', 'none');
	}

	metadata.setKey('license', metadataConfig.license);
	metadata.setKey('author', metadataConfig.author);

	const assetPath = path.relative(outdir, outputPath);
	const updateUrl = metadataConfig.resolveUpdateUrl(assetPath);

	metadata.setKey('updateURL', updateUrl.href);
	metadata.setKey('downloadURL', updateUrl.href);
	metadata.setKey('homepageURL', metadataConfig.homepageUrl);
}

function extractMetaBlock(source: string, assetName: string): MetadataParser {
	const start = source.search(/^\/\/\s*==UserScript==\s*$/m);

	if (start === -1) {
		throw new Error(`Could not find // ==UserScript== in ${assetName}`);
	}

	// Match newline before the line too, so when we slice it,
	// the new line isn't included
	const end = source.search(/\s+^\/\/\s*==\/UserScript==\s*$/m);

	if (end === -1) {
		throw new Error(`Could not find // ==/UserScript== in ${assetName}`);
	}

	const comments = source.slice(start, end).split('\n');

	const metadataOptions: string[] = [];

	// First line (==UserScript==) is included, so skip it
	// Last line (==/UserScript==) is excluded
	for (let index = 1; index < comments.length; ++index) {
		const comment = comments[index]!;

		if (!comment.startsWith('//')) {
			throw new Error(
				`Metadata block is malformed. Line #${index} of metadata block of ${assetName} isn't a comment.`,
			);
		}

		metadataOptions.push(comment.slice(2).trim());
	}

	return new MetadataParser(metadataOptions, assetName);
}

async function addMetadataBlock(
	entryPoint: string,
	outputPath: string,
	outdir: string,
	metadataConfig: MetadataConfig,
) {
	const entrySource = await readFile(entryPoint, 'utf8');
	const outputSource = await readFile(outputPath, 'utf8');

	const assetName = path.basename(entryPoint);
	const metadata = extractMetaBlock(entrySource, assetName);
	enhanceMetadata(metadata, outputSource, outputPath, outdir, metadataConfig);

	const metadataLines = [
		'==UserScript==',
		...metadata.stringify(),
		'==/UserScript==',
	].map(s => `// ${s}`);

	const outputLines = [...metadataLines, outputSource];

	await writeFile(outputPath, outputLines.join('\n'));
}

type MetadataPluginOptions = {
	readonly cwd: string;
	readonly outdir: string;
	readonly metadata: MetadataConfig;
};

export function makeMetadataPlugin(
	options: MetadataPluginOptions,
): esbuild.Plugin {
	const outdir = path.resolve(options.cwd, options.outdir);

	return {
		name: 'userscript-metadata-plugin',
		setup(build) {
			build.onEnd(async result => {
				for (const [outputPath, meta] of Object.entries(
					result.metafile!.outputs,
				)) {
					if (!outputPath.endsWith('.user.js')) {
						continue;
					}

					const output = path.join(options.cwd, outputPath);
					const entry = path.join(options.cwd, meta.entryPoint!);
					await addMetadataBlock(entry, output, outdir, options.metadata);
				}
			});
		},
	} satisfies esbuild.Plugin;
}
