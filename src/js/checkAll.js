import { errorCount, warningCount,setError,setWarning } from "../constants";
import { option } from "./options";
import { Lang } from "./lang/Lang";
import findElements from "./findElements"
import { panelActive, setPanel } from "../constants";
import resetAll from "./resetAll";
import updateBadge from "./updateBadge";
import updatePanel from "./updatePanel";
import checkHeaders from "../rulesets/headers";
import checkLinkText from "../rulesets/linkText";
import checkAltText from "../rulesets/altText"
import checkContrast from "../rulesets/contrast";
import checkReadability from "../rulesets/readability";
import initializeTooltips from "./initializeTooltips";
import { nudge, detectOverflow } from "./utilities";

export default async function checkAll() {
	setError(0);
	setWarning(0);
	// Error handling. If specified selector doesn't exist on page.
	const rootTarget = document.querySelector(option.checkRoot);
	if (!rootTarget) {
        // If target root can't be found, scan the body of page instead.
        var root = document.querySelector("body");

        // Send an alert to panel.
        const $alertPanel = document.getElementById("sa11y-panel-alert");
        const $alertText = document.getElementById("sa11y-panel-alert-text");

        root = option.checkRoot;
        $alertText.innerHTML = `${Lang.sprintf("ERROR_MISSING_ROOT_TARGET", root)}`;
        $alertPanel.classList.add("sa11y-active");
    } else {
        var root = document.querySelector(option.checkRoot);
    }

	let elem=findElements()

	// Ruleset checks
	checkHeaders(elem["h"], elem["h1"]);
	checkLinkText(elem["link"]);
	checkAltText(elem["images"]);

	// Contrast plugin
	if (option.contrastPlugin === true) {
		if (localStorage.getItem("sa11y-remember-contrast") === "On") {
			checkContrast(elem["$contrast"]);
		}
	} else {
		const contrastLi = document.getElementById("sa11y-contrast-li");
		contrastLi.setAttribute("style", "display: none !important;");
		localStorage.setItem("sa11y-remember-contrast", "Off");
	}

	// // Form labels plugin
	// if (option.formLabelsPlugin === true) {
	// 	if (localStorage.getItem("sa11y-remember-labels") === "On") {
	// 		// checkLabels();
	// 	}
	// } else {
	// 	const formLabelsLi = document.getElementById("sa11y-form-labels-li");
	// 	formLabelsLi.setAttribute("style", "display: none !important;");
	// 	localStorage.setItem("sa11y-remember-labels", "Off");
	// }

	// // Links (Advanced) plugin
	// if (option.linksAdvancedPlugin === true) {
	// 	if (localStorage.getItem("sa11y-remember-links-advanced") === "On") {
	// 		// checkLinksAdvanced();
	// 	}
	// } else {
	// 	const linksAdvancedLi = document.getElementById("sa11y-links-advanced-li");
	// 	linksAdvancedLi.setAttribute("style", "display: none !important;");
	// 	localStorage.setItem("sa11y-remember-links-advanced", "Off");
	// }

	// Readability plugin
	if (option.readabilityPlugin === true) {
		if (localStorage.getItem("sa11y-remember-readability") === "On") {
			checkReadability(elem);
		}
	} else {
		const readabilityLi = document.getElementById("sa11y-readability-li");
		const readabilityPanel = document.getElementById("sa11y-readability-panel");
		readabilityLi.setAttribute("style", "display: none !important;");
		readabilityPanel.classList.remove("sa11y-active");
		localStorage.setItem("sa11y-remember-readability", "Off");
	}

	// // Embedded content plugin
	// if (option.embeddedContentAll === true) {
	// 	// checkEmbeddedContent();
	// }

	// // QA module checks.
	// // checkQA();

	// // Custom checks abstracted to seperate class.
	// if (option.customChecks && option.customChecks.setSa11y) {
	// 	option.customChecks.check();
	// }

	// Update panel
	if (panelActive) {
		resetAll();
	} else {
		updatePanel();
	}
	initializeTooltips();
	detectOverflow();
	nudge();

	// Don't show badge when panel is opened.
	if (!document.getElementsByClassName("sa11y-on").length) {
		updateBadge();
	}
}
