// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unsafe-member-access */

/*!
 * This file contains code copied and modified from
 * <https://stackoverflow.com/a/39165137/> by Venryx
 * Licensed under CC BY-SA 4.0 <https://creativecommons.org/licenses/by-sa/4.0/>
 */

// This file expressly NOT licensed under the GNU GPL v3 which is used
// everywhere else in this repository.

function GetCompFiber(fiber: any) {
	let parentFiber = fiber.return;
	while (typeof parentFiber.type === 'string') {
		parentFiber = parentFiber.return;
	}
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return parentFiber;
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function FindReact<T = unknown>(
	dom: HTMLElement,
	traverseUp = 0,
): T | null {
	const key = Object.keys(dom).find(key => key.startsWith('__reactFiber$'));

	// @ts-expect-error
	const domFiber = dom[key];
	if (!domFiber) return null;

	let compFiber = GetCompFiber(domFiber);

	for (let level = 0; level < traverseUp; level++) {
		compFiber = GetCompFiber(compFiber);
	}

	return compFiber.stateNode as T;
}
