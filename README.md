# ETH Userscripts

This repository does not accept unprompted pull requests.
Open an issue first and we can discuss from there.

## Installation

These extensions are distributed as [Userscripts](https://en.wikipedia.org/wiki/Userscript). They can be installed using a userscript manager.

I recommend [Violentmonkey](https://violentmonkey.github.io/). Alternatives are [Tampermonkey](https://www.tampermonkey.net/) or [Greasemonkey](https://www.greasespot.net/).

After installing one of the userscript managers, clicking the `Install` links below will install the userscript for you.

## Moodle Fix PDF Links

[Install](https://userscripts.lusc.ch/eth/moodle-fix-pdf-links/moodle-fix-pdf-links.user.js)

Some courses on Moodle are configured to open PDFs in a popup window.

This userscript fixes that so clicking the link opens the PDF in the same page.

## Moodle No Force Download

[Install](https://userscripts.lusc.ch/eth/moodle-no-force-download/moodle-no-force-download.user.js)

Some courses on Moodle are configured to force the download of PDFs even though browsers are perfectly capable of rendering PDFs.

This userscript fixes that to ensure that PDFs aren't downloaded but rather rendered in the browser.

## Prettier Code Expert

[Install](https://userscripts.lusc.ch/eth/prettier-code-expert/prettier-code-expert.user.js)

This userscript adds a button to format your code on Code Expert using [Prettier](https://prettier.io/). The code is only formatted when the button is pressed.

Currently, supported languages:

- Java

:warning: Formatting does not save the file. Save the file by editing it or with `Ctrl+S`.

## Switch Login ETH Button

[Install](https://userscripts.lusc.ch/eth/switch-login-eth-button/switch-login-eth-button.user.js)

This userscript adds a button on the Switch login page allowing a more easy redirect to the ETH login page.

![Screenshot of the ETH login page redirect button on the Switch login page](images/switch-login-eth-button.png)

## License

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
