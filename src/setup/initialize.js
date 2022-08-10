import { option } from "../js/options";
import buildSa11yUI from "./buildSa11yUI";
import settingPanelToggles from "./settingPanelToggles";
import mainToggle from "./mainToggle";
import skipToIssueTooltip from "./skipToIssueTooltip";
import checkAll from "../js/checkAll";

import { panelActive, setPanel } from "../constants";
import detectPageChanges from "./detectPageChanges";
const checkRunPrevent = () => {
	const { doNotRun } = option;
	return doNotRun.trim().length > 0 ? document.querySelector(doNotRun) : false;
};

const documentLoadingCheck = (callback) => {
	if (document.readyState === "complete") {
		callback();
	} else {
		window.addEventListener("load", callback);
	}
};

export default function Sa11y() {
	if (!checkRunPrevent()) {
		documentLoadingCheck(() => {
			buildSa11yUI();
			settingPanelToggles();
			mainToggle();
			skipToIssueTooltip();
			detectPageChanges();

			// Pass Sa11y instance to custom checker
			// if (option.customChecks && option.customChecks.setSa11y) {
			// 	option.customChecks.setSa11y(this);
			//   }

			document.getElementById("sa11y-toggle").disabled = false;
			if (
				localStorage.getItem("sa11y-remember-panel") === "Closed" ||
				!localStorage.getItem("sa11y-remember-panel")
			) {
				setPanel(true);
				checkAll();
			}
		});
	}
}
