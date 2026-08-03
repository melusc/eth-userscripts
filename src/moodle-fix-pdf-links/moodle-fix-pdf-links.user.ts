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

// ==UserScript==
// @name        Moodle Fix PDF Links
// @match       https://moodle-app2.let.ethz.ch/course/view.php*
// @match       https://moodle-app2.let.ethz.ch/course/section.php*
// @match       https://moodle-app2.let.ethz.ch/mod/resource/view.php*
// @version     1.1.2
// @run-at      document-start
// ==/UserScript==

import {domReady} from '../shared/dom-ready.js';

function disablePopupPdfs() {
	const anchors =
		document.querySelectorAll<HTMLAnchorElement>('a[onclick*="open"]');

	for (const anchor of anchors) {
		anchor.removeAttribute('onclick');

		// Avoid intermediate page
		const pdfUrl = new URL(anchor.href);
		pdfUrl.searchParams.set('redirect', '1');
		anchor.href = pdfUrl.href;
	}
}

domReady(() => {
	disablePopupPdfs();
});
