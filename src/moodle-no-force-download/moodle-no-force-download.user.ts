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
// @name        Moodle No Force Download
// @match       https://moodle-app2.let.ethz.ch/*
// @version     1.0.3
// @run-at      document-start
// ==/UserScript==

import {domReady} from '../shared/dom-ready.js';

domReady(() => {
	const anchors = document.querySelectorAll<HTMLAnchorElement>(
		'a[href*="forcedownload="]',
	);

	for (const anchor of anchors) {
		const url = new URL(anchor.href);
		url.searchParams.delete('forcedownload');
		anchor.href = url.href;
	}
});
