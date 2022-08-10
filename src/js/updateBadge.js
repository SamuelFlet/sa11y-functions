import { warningCount, errorCount } from "../constants";
import { Lang } from "../js/lang/Lang";
export default function updateBadge() {
	const totalCount = errorCount + warningCount;
	const notifBadge = document.getElementById("sa11y-notification-badge");
	const notifCount = document.getElementById("sa11y-notification-count");
	const notifText = document.getElementById("sa11y-notification-text");

	if (totalCount === 0) {
		notifBadge.style.display = "none";
	} else if (warningCount > 0 && errorCount === 0) {
		notifBadge.style.display = "flex";
		notifBadge.classList.add("sa11y-notification-badge-warning");
		notifCount.innerText = `${warningCount}`;
		notifText.innerText = `${Lang._("PANEL_ICON_WARNINGS")}`;
	} else {
		notifBadge.style.display = "flex";
		notifBadge.classList.remove("sa11y-notification-badge-warning");
		notifCount.innerText = `${totalCount}`;
		notifText.innerText = Lang._("PANEL_ICON_TOTAL");
	}
}
