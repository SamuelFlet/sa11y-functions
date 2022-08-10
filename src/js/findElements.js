import {
	isElementHidden,
	linkIgnore,
	containerIgnore,
	readabilityIgnore,
	headerIgnore,
	imageIgnore,
	contrastIgnore,
} from "./utilities";
import { option } from "./options";

export default function () {
	let container = document.querySelector(option.checkRoot);
	let readabilityContainer = document.querySelector(option.readabilityRoot);

	// Error handling. If target area does not exist, scan body.
	if (!container) {
		container = document.querySelector("body");
	} else {
		container = document.querySelector(option.checkRoot);
	}

	if (!readabilityContainer) {
		readabilityContainer = document.querySelector("body");
	} else {
		readabilityContainer = document.querySelector(option.readabilityRoot);
	}

	// Sa11y's panel container
	let panel = document.getElementById("sa11y-container");

	// Exclusions constants
	const containerExclusions = Array.from(
		document.querySelectorAll(containerIgnore)
	);
	const readabilityExclusions = Array.from(
		document.querySelectorAll(readabilityIgnore)
	);

	// Exclusions constants
	//  const containerExclusions = Array.from(document.querySelectorAll(this.containerIgnore));
	//  const readabilityExclusions = Array.from(document.querySelectorAll(this.readabilityIgnore));

	//Contrast
	const $findcontrast = Array.from(container.querySelectorAll("*"));
	const excludeContrast = Array.from(
		container.querySelectorAll(contrastIgnore)
	);
	let $contrast = $findcontrast.filter(($el) => !excludeContrast.includes($el));

	// Readability
	let $findreadability = Array.from(
		readabilityContainer.querySelectorAll("p, li")
	);

	// Inputs
	const $findinputs = Array.from(
		container.querySelectorAll("input, select, textarea")
	);
	let $inputs = $findinputs.filter(
		($el) => !containerExclusions.includes($el) && !isElementHidden($el)
	);

	// Links
	const $findlinks = Array.from(container.querySelectorAll("a[href]"));
	const excludelinks = Array.from(container.querySelectorAll(linkIgnore));
	let $links = $findlinks.filter(($el) => !excludelinks.includes($el));

	//Paragraphs
	const $findp = Array.from(container.querySelectorAll("p"));
	let $p = $findp.filter(($el) => !containerExclusions.includes($el));

	// Headings
	const allHeadings = Array.from(
		container.querySelectorAll(
			"h1, h2, h3, h4, h5, h6, [role='heading'][aria-level]"
		)
	);
	const excludeHeadings = Array.from(container.querySelectorAll(headerIgnore));
	let $h = allHeadings.filter(($el) => !excludeHeadings.includes($el));

	const allH1 = Array.from(
		document.querySelectorAll("h1, [role='heading'][aria-level='1']")
	);
	let $h1 = allH1.filter(($el) => !excludeHeadings.includes($el));

	// Images
	const images = Array.from(container.querySelectorAll("img"));
	const excludeimages = Array.from(container.querySelectorAll(imageIgnore));
	let $img = images.filter(($el) => !excludeimages.includes($el));

	// iFrames
	const $findiframes = Array.from(
		container.querySelectorAll("iframe, audio, video")
	);
	let $iframes = $findiframes.filter(
		($el) => !containerExclusions.includes($el)
	);
	let $videos = $iframes.filter(($el) => $el.matches(option.videoContent));
	let $audio = $iframes.filter(($el) => $el.matches(option.audioContent));
	let $dataviz = $iframes.filter(($el) => $el.matches(option.dataVizContent));
	let $twitter = $iframes.filter(($el) => $el.matches(option.twitterContent));
	let $embeddedContent = $iframes.filter(
		($el) => !$el.matches(option.embeddedContent)
	);

	//Blockquotes
	const $findblockquotes = Array.from(container.querySelectorAll("blockquote"));
	let $blockquotes = $findblockquotes.filter(
		($el) => !containerExclusions.includes($el)
	);

	// Error handling for readability.
	if (!$findreadability) {
		// If not null.
	} else {
		$findreadability = Array.from(
			readabilityContainer.querySelectorAll("p, li")
		);
	}
	let $readability = $findreadability.filter(
		($el) => !readabilityExclusions.includes($el)
	);

	return {
		readability: $readability,
		inputs: $inputs,
		link: $links,
		p: $p,
		h: $h,
		h1: $h1,
		images: $img,
		iframe: $iframes,
		blockquotes: $blockquotes,
		$contrast: $contrast,
	};
}
