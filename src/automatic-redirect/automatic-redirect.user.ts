// ==UserScript==
// @name        ETH Automatic Redirect
// @match       https://moodle-app2.let.ethz.ch/auth/shibboleth/login.php*
// @version     1.0.0
// @run-at      document-start
// ==/UserScript==

import {domReady} from '../shared/dom-ready.js';

function moodleLoginRedirect() {
	const idpInput = document.querySelector<HTMLSelectElement>('#idp');

	if (!idpInput) {
		console.error('Could not find #idp element.');
		return;
	}

	idpInput.value = 'https://aai-logon.ethz.ch/idp/shibboleth';
	idpInput.form?.submit();
}

domReady(() => {
	moodleLoginRedirect();
});
