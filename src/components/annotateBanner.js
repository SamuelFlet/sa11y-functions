import { ERROR, GOOD, WARNING } from "../constants";
import { escapeHTML } from "../js/utilities";
import { Lang } from "../js/lang/Lang";
import { errorCount, setError, warningCount, setWarning } from "../constants";

export default function annotateBanner(type, content) {
	let message = content;

	const validTypes = [ERROR, WARNING, GOOD];

	if (validTypes.indexOf(type) === -1) {
		throw Error(`Invalid type [${type}] for annotation`);
	}

	const CSSName = {
		[validTypes[0]]: "error",
		[validTypes[1]]: "warning",
		[validTypes[2]]: "good",
	};

	// Update error or warning count.
	[type].forEach(($el) => {
		if ($el === ERROR) {
			setError(errorCount + 1);
		} else if ($el === WARNING) {
			setWarning(warningCount + 1);
		}
	});

	// Check if content is a function & make translations easier.
	if (message && {}.toString.call(message) === "[object Function]") {
		message = message
			.replaceAll(/<hr>/g, '<hr aria-hidden="true">')
			.replaceAll(
				/<a[\s]href=/g,
				'<a target="_blank" rel="noopener noreferrer" href='
			)
			.replaceAll(
				/<\/a>/g,
				`<span class="sa11y-visually-hidden"> (${Lang._("NEW_TAB")})</span></a>`
			)
			.replaceAll(/{r}/g, 'class="sa11y-red-text"');
		message = escapeHTML(message);
	}

	return `<div class="sa11y-instance sa11y-${
		CSSName[type]
	}-message-container"><div role="region" data-sa11y-annotation tabindex="-1" aria-label="${[
		type,
	]}" class="sa11y-${CSSName[type]}-message" lang="${Lang._(
		"LANG_CODE"
	)}">${message}</div></div>`;
}
