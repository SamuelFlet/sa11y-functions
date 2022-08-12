import loadGlobals from "../js/LoadGlobals";
import resetAll from "../js/resetAll";
import scanPage from "../js/checkAll";
import updateBadge from "../js/updatebadge.js";

export default function generalSetup() {
	const elemtoIgnore = loadGlobals();
	var sa11yToggle = document.querySelector("#sa11y-toggle");
	const $panel = document.getElementById("sa11y-panel");
	
	sa11yToggle.addEventListener("click", (e) => {
		if (localStorage.getItem("sa11y-remember-panel") === "Opened") {
			localStorage.setItem("sa11y-remember-panel", "Closed");
			sa11yToggle.classList.remove("sa11y-on");
			$panel.classList.remove("sa11y-active");
			sa11yToggle.setAttribute("aria-expanded", "false");
			resetAll();
			updateBadge();
			e.preventDefault();
		} else {
			localStorage.setItem("sa11y-remember-panel", "Opened");
			$panel.classList.add("sa11y-active");
			sa11yToggle.classList.add("sa11y-on");
			sa11yToggle.setAttribute("aria-expanded", "true");
			scanPage(elemtoIgnore);
			// Don't show badge when panel is opened.
			document.getElementById("sa11y-notification-badge").style.display =
				"none";
			e.preventDefault();
		}
	});

	if (localStorage.getItem("sa11y-panel") === "opened") {
		sa11yToggle.classList.add("sa11y-on");
		sa11yToggle.setAttribute("aria-expanded", "true");
	}

	//Escape key to shutdown.
	// Check if working:
	// $(document).keyup((e) => {
	//     if (e.keyCode == 27 && $("#sa11y-panel").hasClass("sa11y-active")) {
	//         tippy.hideAll();
	//         sessionStorage.enableSa11y = "";
	//         localStorage.setItem("sa11y-panel", "closed");
	//         sa11yToggle.removeClass("sa11y-on").attr("aria-expanded", "false");
	//         reset();
	//     } else {
	//         this.onkeyup = null;
	//     }
	// });
}
