// ==UserScript==
// @name        Prettier Code Expert
// @match       https://expert.ethz.ch/*
// @version     1.0.0
// @run-at      document-start
// ==/UserScript==

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

import type {Plugin} from 'prettier';
import prettier from 'prettier/standalone';
import prettierPluginJava from 'prettier-plugin-java';

import {domReady} from '../shared/dom-ready.js';

import {FindReact} from './find-react.js';

if (location.protocol === 'http:') {
	location.protocol = 'https:';
}

const formatButtonId = 'prettier-code-expert-format-button';
const queries = {
	formatButton: `#${formatButtonId}`,
	nextTaskButton: '[title="Next task in exercise"]',
	saveIndicator: '[data-testid="ide-save-indicator"]',
	aceEditor: '#ace-editor',
};

function findState(element: HTMLElement): unknown {
	for (let c = 0; c < 10; ++c) {
		const state: unknown = FindReact(element, c);
		if (state) {
			return state;
		}
	}

	return undefined;
}

async function formatCode(code: string, fileName: string) {
	let parser: string;
	let plugin: Plugin;

	const extension = fileName.split('.').at(-1);
	if (extension === 'java') {
		parser = 'java';
		plugin = prettierPluginJava;
	} else {
		alert(`Cannot format .${extension} files (yet).`);
		return;
	}

	try {
		return await prettier.format(code, {
			parser,
			plugins: [plugin],
			filepath: fileName,

			// Formatting (opinionated, sorry)
			arrowParens: 'avoid',
			bracketSpacing: false,
			jsxSingleQuote: true,
			singleQuote: true,
			useTabs: true,
		});
	} catch (error: unknown) {
		console.error(error);
		alert(
			'An error occured while formatting. Check console for more information.',
		);
	}

	return;
}

async function formatEditor() {
	const editorParent = document.querySelector(queries.aceEditor)?.parentElement;
	if (!editorParent) {
		return;
	}
	const state = findState(editorParent) as
		| {
				state: {
					fileName: string;
					editorContent: string;
				};
				setState(state: {editorContent: string}): void;
		  }
		| undefined;

	if (!state) {
		alert('Could not extract code for formatting.');
		return;
	}
	console.log(state);

	const result = await formatCode(
		state.state.editorContent,
		state.state.fileName,
	);
	if (result) {
		state.setState({
			editorContent: result,
		});
	}
}

function insertFormatButton() {
	const oldButton = document.querySelector(queries.formatButton);

	if (oldButton) {
		return;
	}

	const saveIndicator = document.querySelector(queries.saveIndicator);
	const target = saveIndicator?.parentElement;
	const downloadButton = document.querySelector(queries.nextTaskButton);

	if (!target || !downloadButton) {
		return;
	}

	const button = downloadButton.cloneNode(false) as HTMLButtonElement;
	button.id = formatButtonId;
	button.title = 'Format Code';
	button.textContent = 'fmt';
	button.disabled = false;
	button.classList.remove('ant-btn-circle');

	button.addEventListener('click', () => {
		void formatEditor();
	});
	button.addEventListener('keyup', event => {
		const key = event.key.toLowerCase();
		if (key === 'enter' || key === ' ') {
			void formatEditor();
		}
	});

	const wrapper = document.createElement('div');
	wrapper.append(button);

	target.before(wrapper);
}

function cleanup() {
	const button = document.querySelector(queries.formatButton);
	if (button?.parentElement) {
		button.parentElement.remove();
	}
}

function listenRenderUpdates(
	isVisible: () => boolean,
	onMount: () => void,
	onUnmount: () => void,
) {
	// Only call if the element is now present and wasn't before.
	let lastState = isVisible();

	if (lastState) {
		onMount();
	} else {
		onUnmount();
	}

	const mutationObserver = new MutationObserver(() => {
		const newState = isVisible();

		if (newState && !lastState) {
			onMount();
		} else if (!newState && lastState) {
			onUnmount();
		}

		lastState = newState;
	});

	mutationObserver.observe(document.body, {
		subtree: true,
		childList: true,
	});
}

domReady(() => {
	listenRenderUpdates(
		() =>
			!!(
				document.querySelector(queries.nextTaskButton) &&
				document.querySelector(queries.saveIndicator) &&
				document.querySelector(queries.aceEditor)
			),
		insertFormatButton,
		cleanup,
	);
});
