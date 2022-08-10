import { ERROR, WARNING, GOOD, TOOLICON } from "./constants";
import en from "./js/lang/en.js";
import fr from "./js/lang/fr.js";
const url = window.location.href;

var config = {
	root: "body",
	lang: {
		//Language code, e.g. "fr"
		LANG_CODE: "en",
		en,
		text: {
			[ERROR]: "Error", //Erreur
			[WARNING]: "Warning", //Attention
			[GOOD]: "Good", //Bon
		},
	},
	ignore: {
		container: ".sa11y-ignore, #sa11y-container", //Ignore specific regions.
		outline: "", //Exclude headings from outline panel.
		header: "", //Ignore specific headings. E.g. "h1.jumbotron-heading"
		image: "", //Ignore specific images.
		link: "", //Ignore specific links.
	},
	icon: TOOLICON,
};

export { config };
