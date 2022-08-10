import { Lang } from "../js/lang/Lang";

export default function displayPanels(issueCount) {
	let errorCount = issueCount["error"];
	let warningCount = issueCount["warning"];
	const $panelContent = document.getElementById("sa11y-panel-content");
	const $status = document.getElementById("sa11y-status");
	const $findButtons = document.querySelectorAll(".sa11y-btn");
	
	const $skipBtn = document.getElementById("sa11y-cycle-toggle");
	$skipBtn.disabled = false;
	$skipBtn.setAttribute("style", "cursor: pointer !important;");
	//New Total Counts
	if (errorCount > 0 && warningCount > 0) {
		document
			.querySelector("#sa11y-panel-content")
			.classList.add("sa11y-errors");
		$status.innerHTML = `${Lang._(
			"ERRORS"
		)} <span class="sa11y-panel-count sa11y-margin-right">${errorCount}</span> ${Lang._(
			"WARNINGS"
		)} <span class="sa11y-panel-count">${warningCount}</span>`;
	} else if (errorCount > 0) {
		$panelContent.setAttribute("class", "sa11y-errors");
		$status.innerHTML = `${Lang._(
			"ERRORS"
		)} <span class="sa11y-panel-count">${errorCount}</span>`;
	} else if (warningCount > 0) {
		$panelContent.setAttribute("class", "sa11y-warnings");
		$status.innerHTML = `${Lang._(
			"WARNINGS"
		)} <span class="sa11y-panel-count">${warningCount}</span>`;
	} else {
		$panelContent.setAttribute("class", "sa11y-good");
		$status.textContent = `${Lang._("PANEL_STATUS_NONE")}`;

		if ($findButtons.length === 0) {
			$skipBtn.disabled = true;
			$skipBtn.setAttribute("style", "cursor: default !important;");
		}
	}

	//Building the panel
	const $outlineToggle = document.getElementById("sa11y-outline-toggle");
	const $outlinePanel = document.getElementById("sa11y-outline-panel");
	const $outlineList = document.getElementById("sa11y-outline-list");
	const $settingsToggle = document.getElementById("sa11y-settings-toggle");
	const $settingsPanel = document.getElementById("sa11y-settings-panel");
	const $settingsContent = document.getElementById("sa11y-settings-content");
	const $headingAnnotations = document.querySelectorAll(".sa11y-heading-label");

	//Show the outline panel
	$outlineToggle.addEventListener("click", () => {
		if ($outlineToggle.getAttribute("aria-expanded") === "true") {
			$outlineToggle.classList.remove("sa11y-outline-active");
			$outlinePanel.classList.remove("sa11y-active");
			$outlineToggle.textContent = `${Lang._("SHOW_OUTLINE")}`;
			$outlineToggle.setAttribute("aria-expanded", "false");
			localStorage.setItem("sa11y-remember-outline", "Closed");
		} else {
			$outlineToggle.classList.add("sa11y-outline-active");
			$outlinePanel.classList.add("sa11y-active");
			$outlineToggle.textContent = `${Lang._("HIDE_OUTLINE")}`;
			$outlineToggle.setAttribute("aria-expanded", "true");
			localStorage.setItem("sa11y-remember-outline", "Opened");
		}

		//Set focus on Page Outline for heading accessibility
		document.querySelector("#sa11y-outline-header > h2").focus();

		//Show the heading level annotations
		$headingAnnotations.forEach(($el) =>
			$el.classList.toggle("sa11y-label-visible")
		);

		// Close Settings panel when Show Outline is active.
		$settingsPanel.classList.remove("sa11y-active");
		$settingsToggle.classList.remove("sa11y-settings-active");
		$settingsToggle.setAttribute("aria-expanded", "false");
		$settingsToggle.textContent = `${Lang._("SHOW_SETTINGS")}`;

		// Keyboard accessibility fix for scrollable panel content.
		if ($outlineList.clientHeight > 250) {
			$outlineList.setAttribute("tabindex", "0");
		}
	});

	// Remember to leave outline open
	if (localStorage.getItem("sa11y-remember-outline") === "Opened") {
		$outlineToggle.classList.add("sa11y-outline-active");
		$outlinePanel.classList.add("sa11y-active");
		$outlineToggle.textContent = `${Lang._("HIDE_OUTLINE")}`;
		$outlineToggle.setAttribute("aria-expanded", "true");
		$headingAnnotations.forEach(($el) =>
			$el.classList.toggle("sa11y-label-visible")
		);
		// Keyboard accessibility fix for scrollable panel content.
		if ($outlineList.clientHeight > 250) {
			$outlineList.setAttribute("tabindex", "0");
			$outlineList.setAttribute("aria-label", `${Lang._("PAGE_OUTLINE")}`);
			$outlineList.setAttribute("role", "region");
		}
	}

	// Show settings panel
	$settingsToggle.addEventListener("click", () => {
		if ($settingsToggle.getAttribute("aria-expanded") === "true") {
			$settingsToggle.classList.remove("sa11y-settings-active");
			$settingsPanel.classList.remove("sa11y-active");
			$settingsToggle.textContent = `${Lang._("SHOW_SETTINGS")}`;
			$settingsToggle.setAttribute("aria-expanded", "false");
		} else {
			$settingsToggle.classList.add("sa11y-settings-active");
			$settingsPanel.classList.add("sa11y-active");
			$settingsToggle.textContent = `${Lang._("HIDE_SETTINGS")}`;
			$settingsToggle.setAttribute("aria-expanded", "true");
		}

		// Set focus on Settings heading for accessibility.
		document.querySelector("#sa11y-settings-header > h2").focus();

		// Close Show Outline panel when Settings is active.
		$outlinePanel.classList.remove("sa11y-active");
		$outlineToggle.classList.remove("sa11y-outline-active");
		$outlineToggle.setAttribute("aria-expanded", "false");
		$outlineToggle.textContent = `${Lang._("SHOW_OUTLINE")}`;
		$headingAnnotations.forEach(($el) =>
			$el.classList.remove("sa11y-label-visible")
		);
		localStorage.setItem("sa11y-remember-outline", "Closed");

		// Keyboard accessibility fix for scrollable panel content.
		if ($settingsContent.clientHeight > 350) {
			$settingsContent.setAttribute("tabindex", "0");
			$settingsContent.setAttribute("aria-label", `${Lang._("SETTINGS")}`);
			$settingsContent.setAttribute("role", "region");
		}
	});
	// Enhanced keyboard accessibility for panel.
	document
		.getElementById("sa11y-panel-controls")
		.addEventListener("keydown", (e) => {
			const $tab = document.querySelectorAll(
				"#sa11y-outline-toggle[role=tab], #sa11y-settings-toggle[role=tab]"
			);
			if (e.key === "ArrowRight") {
				for (let i = 0; i < $tab.length; i++) {
					if (
						$tab[i].getAttribute("aria-expanded") === "true" ||
						$tab[i].getAttribute("aria-expanded") === "false"
					) {
						$tab[i + 1].focus();
						e.preventDefault();
						break;
					}
				}
			}
			if (e.key === "ArrowDown") {
				for (let i = 0; i < $tab.length; i++) {
					if (
						$tab[i].getAttribute("aria-expanded") === "true" ||
						$tab[i].getAttribute("aria-expanded") === "false"
					) {
						$tab[i + 1].focus();
						e.preventDefault();
						break;
					}
				}
			}
			if (e.key === "ArrowLeft") {
				for (let i = $tab.length - 1; i > 0; i--) {
					if (
						$tab[i].getAttribute("aria-expanded") === "true" ||
						$tab[i].getAttribute("aria-expanded") === "false"
					) {
						$tab[i - 1].focus();
						e.preventDefault();
						break;
					}
				}
			}
			if (e.key === "ArrowUp") {
				for (let i = $tab.length - 1; i > 0; i--) {
					if (
						$tab[i].getAttribute("aria-expanded") === "true" ||
						$tab[i].getAttribute("aria-expanded") === "false"
					) {
						$tab[i - 1].focus();
						e.preventDefault();
						break;
					}
				}
			}
		});

	const $closeAlertToggle = document.getElementById("sa11y-close-alert");
	const $alertPanel = document.getElementById("sa11y-panel-alert");
	const $alertText = document.getElementById("sa11y-panel-alert-text");

	$closeAlertToggle.addEventListener("click", () => {
		$alertPanel.classList.remove("sa11y-active");
		while ($alertText.firstChild) $alertText.removeChild($alertText.firstChild);
		document
			.querySelectorAll(".sa11y-pulse-border")
			.forEach((el) => el.classList.remove("sa11y-pulse-border"));
		$skipBtn.focus();
	});
	if ($findButtons.length === 0) {
		$skipBtn.disabled = true;
		$skipBtn.setAttribute('style', 'cursor: default !important;');
	  }
}
