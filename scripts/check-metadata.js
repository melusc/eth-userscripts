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

import assert from 'node:assert/strict';
import {readdirSync as readdir, readFileSync as readFile} from 'node:fs';
import {exit} from 'node:process';

const outDirectory = new URL('../dist/', import.meta.url);

/**
 * @param {string} contents
 * @returns {(regex: RegExp, message: string) => void}
 */
function createFind(contents) {
	return (regex, message) => {
		assert.match(contents, regex, message);
	};
}

try {
	const files = readdir(outDirectory, {recursive: true});

	for (const relativePath of files) {
		if (!relativePath.endsWith('.user.js')) {
			continue;
		}

		const path = new URL(relativePath, outDirectory);
		const contents = readFile(path, 'utf8');
		const name = relativePath.split(/[\\/]/).at(-1);

		const find = createFind(contents);

		find(
			/^\/\/\s*==UserScript==$/m,
			`Did not start metadata block with ==UserScript== in ${name}.`,
		);
		find(
			/^\/\/\s*==\/UserScript==$/m,
			`Did not end metadata block with ==/UserScript== in ${name}.`,
		);
		find(/^\/\/\s*@name\s+/m, `Did not have @name in ${name}.`);
		find(
			/^\/\/\s*@version\s+\d+\.\d+\.\d+$/m,
			`Did not declare version using semver in ${name}.`,
		);
	}
} catch (error) {
	// Print red
	console.error('\u{1B}[31m%s\u{1B}[39m', error.message);
	exit(1);
}
