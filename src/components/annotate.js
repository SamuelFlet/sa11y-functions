import { ERROR, GOOD, WARNING } from "../constants";
import { escapeHTML } from "../js/utilities";
import { Lang } from "../js/lang/Lang";
import { errorCount, setError, warningCount, setWarning } from "../constants";

export default function annotate(type, content, inline = false) {
	let message = content;
	const validTypes = [ERROR, WARNING, GOOD];

	// TODO: Discuss Throwing Errors.
	if (validTypes.indexOf(type) === -1) {
		throw Error(`Invalid type [${type}] for annotation`);
	}

	[type].forEach(($el) => {
        if ($el === ERROR) {
          setError(errorCount+1);
        } else if ($el === WARNING) {
          setWarning(warningCount+1);
        }
      });

	const CSSName = {
		[validTypes[0]]: "error",
		[validTypes[1]]: "warning",
		[validTypes[2]]: "good",
	};

	message = message
        .replaceAll(/<hr>/g, '<hr aria-hidden="true">')
        .replaceAll(/<a[\s]href=/g, '<a target="_blank" rel="noopener noreferrer" href=')
        .replaceAll(/<\/a>/g, `<span class="sa11y-visually-hidden"> (${Lang._('NEW_TAB')})</span></a>`)
        .replaceAll(/{r}/g, 'class="sa11y-red-text"');

      message = escapeHTML(message);

      return `<div class=${inline ? 'sa11y-instance-inline' : 'sa11y-instance'}>
                <button data-sa11y-annotation type="button" aria-label="${[type]}" class="sa11y-btn sa11y-${CSSName[type]}-btn${inline ? '-text' : ''}" data-tippy-content="<div lang='${Lang._('LANG_CODE')}'><div class='sa11y-header-text'>${[type]}</div>${message}</div>"></button>
              </div>`;
}
