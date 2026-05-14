/*!
	* This program is free software: you can redistribute it and/or modify it under
	* the terms of the GNU General Public License as published by the Free Software
	* Foundation, either version 3 of the License, or (at your option) any later version.

	* This program is distributed in the hope that it will be useful, but WITHOUT
	* ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
	* FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

	* You should have received a copy of the GNU General Public License along with
	* this program. If not, see <https://www.gnu.org/licenses/>. 
*/

import {parse, type ParseResult} from '@babel/parser';
import traverse_ from '@babel/traverse';
import type {CommentBlock, CommentLine} from '@babel/types';
import webpack, {type Compiler} from 'webpack';

// @ts-expect-error Import is messed up
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const traverse: typeof traverse_ = traverse_.default;

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

	hasKey(key: string) {
		return this.#kv.has(key);
	}

	getKey(key: string) {
		return this.#kv.get(key);
	}

	clearKey(key: string) {
		this.#kv.delete(key);
	}

	setKey(key: string, value: string) {
		this.#kv.set(key, [value]);
	}

	addKey(key: string, value: string) {
		if (this.#kv.has(key)) {
			this.#kv.get(key)!.push(value);
		} else {
			this.#kv.set(key, [value]);
		}
	}

	stringify() {
		return this.#kv
			.entries()
			.flatMap(([key, valueArray]) =>
				valueArray.map(value => (value ? `@${key} ${value}` : `@${key}`)),
			)
			.toArray()
			.toSorted();
	}
}

function findComment(
	match: string,
	comments: ReadonlyArray<CommentBlock | CommentLine> | null | undefined,
) {
	const index = comments?.findIndex(comment => comment.value.trim() === match);

	if (index === undefined || index === -1) {
		return;
	}

	const comment = comments![index]!;
	return {
		index,
		comment,
	};
}

function resolveGrants(source: ParseResult) {
	const grants = new Set<string>();

	traverse(source, {
		CallExpression(path) {
			// see https://violentmonkey.github.io/api/metadata-block/#grant
			// find all special APIs used
			// - GM_*
			// - GM.*
			// - window.close and window.focus

			// something()
			if (path.node.callee.type === 'Identifier') {
				const name = path.node.callee.name;
				if (name.startsWith('GM_')) {
					grants.add(name);
				}
			} else if (
				// something.something()
				path.node.callee.type === 'MemberExpression' &&
				path.node.callee.object.type === 'Identifier' &&
				path.node.callee.property.type === 'Identifier'
			) {
				const objectName = path.node.callee.object.name;
				const propertyName = path.node.callee.property.name;

				// Match all GM.* and window.focus or window.close
				if (
					objectName === 'GM' ||
					(objectName === 'window' && ['close', 'focus'].includes(propertyName))
				) {
					grants.add(`${objectName}.${propertyName}`);
				}
			}
		},
	});

	return [...grants].toSorted();
}

function enhanceMetadata(
	metadata: MetadataParser,
	source: ParseResult,
	assetName: string,
) {
	const grants = resolveGrants(source);

	if (grants.length > 0) {
		metadata.clearKey('grant');

		for (const grant of grants) {
			metadata.addKey('grant', grant);
		}
	} else {
		metadata.setKey('grant', 'none');
	}

	metadata.setKey('license', 'GPL-3.0-or-later');
	metadata.setKey('author', 'Luca Schnellmann <oss@lusc.ch>');

	const updateURL = new URL(assetName, 'https://userscripts.lusc.ch/eth/');

	metadata.setKey('updateURL', updateURL.href);
	metadata.setKey('downloadURL', updateURL.href);
	metadata.setKey('homepageURL', 'https://github.com/melusc/eth-userscripts');
}

export class MetadataPlugin {
	apply(compiler: Compiler) {
		compiler.hooks.thisCompilation.tap('MetadataPlugin', compilation => {
			compilation.hooks.processAssets.tap(
				{
					name: 'MetadataPlugin',
					stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
				},
				() => {
					for (const asset of compilation.getAssets()) {
						const sourceStringOrBuffer = asset.source.source();
						const source =
							typeof sourceStringOrBuffer === 'string'
								? sourceStringOrBuffer
								: sourceStringOrBuffer.toString('utf8');

						const parsed = parse(source);
						const start = findComment('==UserScript==', parsed.comments);
						const end = findComment('==/UserScript==', parsed.comments);

						if (!start || !end) {
							console.warn('Could not find metadata-block in %s.', asset.name);
							continue;
						}

						if (
							start.comment.start === undefined ||
							end.comment.end === undefined
						) {
							throw new Error(
								`start.comment.start or end.comment.end were undefined in ${asset.name}.`,
							);
						}

						const commentSource = parsed
							.comments!.slice(start.index + 1, end.index)
							.map(comment => comment.value);
						const metadata = new MetadataParser(commentSource, asset.name);
						enhanceMetadata(metadata, parsed, asset.name);

						const sourceBefore = source.slice(0, start.comment.start);
						const sourceAfter = source.slice(end.comment.end);

						const commentBlock = [
							'==UserScript==',
							...metadata.stringify(),
							'==/UserScript==',
						]
							.map(s => `// ${s}`)
							.join('\n');
						const updatedSource = [
							sourceBefore,
							commentBlock,
							sourceAfter,
						].join('\n');

						compilation.updateAsset(
							asset.name,
							new webpack.sources.RawSource(updatedSource),
						);
					}
				},
			);
		});
	}
}
