import annotate from "../../components/annotate";
import { ERROR, GOOD, WARNING } from "../../constants";

export default function customRules(root) {
	const C = {
		ANNOUNCEMENT_MESSAGE:
			"More than one Announcement component found! The Announcement component should be used strategically and sparingly. It should be used to get attention or indicate that something is important. Misuse of this component makes it less effective or impactful. Secondly, this component is semantically labeled as an Announcement for people who use screen readers.",

		ACCORDION_FORM_MESSAGE:
			"Do <strong>not nest forms</strong> within the Accordion component. If the form contains validation issues, a person may not see the form feedback since the accordion panel goes back to its original closed state.",
	};

	/* Example #1 */
	function $checkAnnouncement() {
		let announcements = document.querySelectorAll(".sa11y-announcement-component")
		if (announcements.length > 1) {
			for (let i = 1; i < announcements.length; i++) {
				announcements[i].classList.add("sa11y-warning-border");
				announcements[i].insertAdjacentHTML(
					"beforebegin",
					annotate(WARNING, C.ANNOUNCEMENT_MESSAGE)
				);
			}
		}
	}

	/* Example #2  */
	function $checkAccordions() {
		root.querySelectorAll(".sa11y-accordion-example").forEach(($el) => {
			const checkForm = $el.querySelector("form");
			if (!!checkForm && checkForm.length) {
				$el.classList.add("sa11y-error-border");
				$el.insertAdjacentHTML(
					"beforebegin",
					annotate(ERROR, C.ACCORDION_FORM_MESSAGE)
				);
			}
		});
	}

	//Call the functions
	$checkAnnouncement();
	$checkAccordions();
}
