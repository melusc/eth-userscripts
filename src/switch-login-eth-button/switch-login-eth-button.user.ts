// ==UserScript==
// @name        Switch Login ETH Button
// @match       https://wayf.switch.ch/SWITCHaai/WAYF
// @version     1.0.1
// @run-at      document-end
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

import {domReady} from '../shared/dom-ready.js';

function getEthLogo() {
	const logo = document
		.querySelector<HTMLOptionElement>(
			'#userIdPSelection option[logo][value*=".ethz.ch/"]',
		)
		?.getAttribute('logo');

	if (!logo) {
		throw new Error('No .logo attribute on ETH option');
	}

	return logo;
}

function getActionButton() {
	return document.querySelector<HTMLElement>(
		'#userIdPSelection_iddlist .idd_listItem[savedvalue*=".ethz.ch/"',
	);
}

function addEthButton() {
	const button = document.createElement('button');
	button.type = 'button';
	button.classList.add(
		'btn',
		'btn-primary',
		'p-0',
		'pe-4',
		'd-flex',
		'column-gap-2',
	);

	const iconWrapper = document.createElement('span');
	iconWrapper.style.padding = '5px';
	iconWrapper.style.backgroundColor = 'white';
	iconWrapper.style.borderRadius = '50%';

	const icon = document.createElement('img');
	icon.src = getEthLogo();
	icon.style.height = '100%';
	icon.style.aspectRatio = '1 / 1';

	iconWrapper.append(icon);

	const textWrapper = document.createElement('span');
	textWrapper.style.color = 'inherit';
	textWrapper.style.padding = '7px 0';
	textWrapper.style.whiteSpace = 'nowrap';
	textWrapper.textContent = 'ETH Zürich';

	button.append(iconWrapper, textWrapper);

	button.addEventListener('click', () => {
		getActionButton()!.click();
	});

	const submitButton = document.querySelector<HTMLButtonElement>(
		'button[name="Select"]',
	);
	if (submitButton) {
		submitButton.before(button);

		submitButton.parentElement!.classList.add(
			'd-flex',
			'justify-content-between',
		);
	} else {
		const target = document.querySelector('#userInputArea')?.lastElementChild;
		if (!target) {
			throw new Error('Could not find lastElementChild of #userInputArea');
		}

		const clearfix = document.createElement('div');
		clearfix.classList.add('clearfix');

		const container = document.createElement('div');
		container.classList.add('mt-3', 'd-flex', 'justify-content-between');
		container.append(button);

		target.append(clearfix, container);
	}
}

domReady(addEthButton);
