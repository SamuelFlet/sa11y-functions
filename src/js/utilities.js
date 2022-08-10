import { option } from "./options";

if (!option.readabilityRoot) {
	option.readabilityRoot = option.checkRoot;
}

/* Exclusions */
// Container ignores apply to self and children.
if (option.containerIgnore) {
	const containerSelectors = option.containerIgnore
		.split(",")
		.map((el) => `${el} *, ${el}`);

	option.containerIgnore = `[aria-hidden], [data-tippy-root] *, #sa11y-container *, #wpadminbar *, ${containerSelectors.join(
		", "
	)}`;
} else {
	option.containerIgnore =
		"[aria-hidden], [data-tippy-root] *, #sa11y-container *, #wpadminbar *";
}
let containerIgnore = option.containerIgnore;

// Contrast exclusions
let contrastIgnore = `${containerIgnore}, .sa11y-heading-label, script`;
if (option.contrastIgnore) {
	contrastIgnore = `${option.contrastIgnore}, ${contrastIgnore}`;
}

// Ignore specific regions for readability module.
let readabilityIgnore = `${containerIgnore}, nav li, [role="navigation"] li`;
if (option.readabilityIgnore) {
	readabilityIgnore = `${option.readabilityIgnore}, ${readabilityIgnore}`;
}

// Ignore specific headings
let headerIgnore = containerIgnore;
if (option.headerIgnore) {
	headerIgnore = `${option.headerIgnore}, ${headerIgnore}`;
}

// Don't add heading label or include in panel.
if (option.outlineIgnore) {
	let outlineIgnore = `${option.outlineIgnore}, #sa11y-container h1, #sa11y-container h2`;
}

// Ignore specific images.
let imageIgnore = `${containerIgnore}, [role='presentation'], [src^='https://trck.youvisit.com']`;
if (option.imageIgnore) {
	imageIgnore = `${option.imageIgnore}, ${imageIgnore}`;
}

// Ignore specific links
let linkIgnore = `${containerIgnore}, [aria-hidden="true"], .anchorjs-link`;
if (option.linkIgnore) {
	linkIgnore = `${option.linkIgnore}, ${linkIgnore}`;
}

// Ignore specific classes within links.
if (option.linkIgnoreSpan) {
	const linkIgnoreSpanSelectors = option.linkIgnoreSpan
		.split(",")
		.map((el) => `${el} *, ${el}`);
	option.linkIgnoreSpan = `noscript, ${linkIgnoreSpanSelectors.join(", ")}`;
} else {
	option.linkIgnoreSpan = "noscript";
}

/* Embedded content sources */
// Video sources.
if (option.videoContent) {
	const videoContent = option.videoContent
		.split(/\s*[\s,]\s*/)
		.map((el) => `[src*='${el}']`);
	option.videoContent = `video, ${videoContent.join(", ")}`;
} else {
	option.videoContent = "video";
}

// Audio sources.
if (option.audioContent) {
	const audioContent = option.audioContent
		.split(/\s*[\s,]\s*/)
		.map((el) => `[src*='${el}']`);
	option.audioContent = `audio, ${audioContent.join(", ")}`;
} else {
	option.audioContent = "audio";
}

// Data viz sources.
if (option.dataVizContent) {
	const dataVizContent = option.dataVizContent
		.split(/\s*[\s,]\s*/)
		.map((el) => `[src*='${el}']`);
	option.dataVizContent = dataVizContent.join(", ");
} else {
	option.dataVizContent = "datastudio.google.com, tableau";
}

// Twitter timeline sources.
if (option.twitterContent) {
	const twitterContent = option.twitterContent
		.split(/\s*[\s,]\s*/)
		.map((el) => `[class*='${el}']`);
	option.twitterContent = twitterContent.join(", ");
} else {
	option.twitterContent = "twitter-timeline";
}

// Embedded content all
if (option.embeddedContent) {
	const embeddedContent = option.embeddedContent
		.split(/\s*[\s,]\s*/)
		.map((el) => {
			if (el === "twitter-timeline") {
				return `[class*='${el}']`;
			}
			return `[src*='${el}']`;
		});
	option.embeddedContent = embeddedContent.join(", ");
}

// Check if content is hidden
const isElementHidden = ($el) => {
	if (
		$el.getAttribute("hidden") ||
		($el.offsetWidth === 0 && $el.offsetHeight === 0)
	) {
		return true;
	}
	const compStyles = getComputedStyle($el);
	return compStyles.getPropertyValue("display") === "none";
};

const computeTextNodeWithImage = ($el) => {
	const imgArray = Array.from($el.querySelectorAll("img"));
	let returnText = "";
	// No image, has text.
	if (imgArray.length === 0 && $el.textContent.trim().length > 1) {
		returnText = $el.textContent.trim();
	} else if (imgArray.length && $el.textContent.trim().length === 0) {
		// Has image.
		const imgalt = imgArray[0].getAttribute("alt");
		if (!imgalt || imgalt === " " || imgalt === "") {
			returnText = " ";
		} else if (imgalt !== undefined) {
			returnText = imgalt;
		}
	} else if (imgArray.length && $el.textContent.trim().length) {
		// Has image and text.
		// To-do: This is a hack? Any way to do this better?
		imgArray.forEach((element) => {
			element.insertAdjacentHTML(
				"afterend",
				` <span class='sa11y-clone-image-text' aria-hidden='true'>${imgArray[0].getAttribute(
					"alt"
				)}</span>`
			);
		});
		returnText = $el.textContent.trim();
	}
	return returnText;
};
const sanitizeForHTML = (string) => {
	const entityMap = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
		"/": "&#x2F;",
		"`": "&#x60;",
		"=": "&#x3D;",
	};
	return String(string).replace(/[&<>"'`=/]/g, (s) => entityMap[s]);
};

const findVisibleParent = (element, property, value) => {
	let $el = element;
	while ($el !== null) {
		const style = window.getComputedStyle($el);
		const propValue = style.getPropertyValue(property);
		if (propValue === value) {
			return $el;
		}
		$el = $el.parentElement;
	}
	return null;
};

const offsetTop = ($el) => {
	const rect = $el.getBoundingClientRect();
	const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
	return {
		top: rect.top + scrollTop,
	};
};

const escapeHTML = (text) => {
	const $div = document.createElement("div");
	$div.textContent = text;
	return $div.innerHTML
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;")
		.replaceAll("`", "&#x60;");
};

const fnIgnore = (element, selector) => {
	const $clone = element.cloneNode(true);
	const $exclude = Array.from(
		selector ? $clone.querySelectorAll(selector) : $clone.children
	);
	$exclude.forEach(($c) => {
		$c.parentElement.removeChild($c);
	});
	return $clone;
};

const debounce = (callback, wait) => {
	let timeoutId = null;
	return (...args) => {
		window.clearTimeout(timeoutId);
		timeoutId = window.setTimeout(() => {
			callback.apply(null, args);
		}, wait);
	};
};

const computeAriaLabel = (el) => {
	// aria-label
	if (el.matches("[aria-label]")) {
		return el.getAttribute("aria-label");
	}
	// aria-labeledby.
	if (el.matches("[aria-labelledby]")) {
		const target = el.getAttribute("aria-labelledby").split(/\s+/);
		if (target.length > 0) {
			let returnText = "";
			target.forEach((x) => {
				const targetSelector = document.querySelector(`#${x}`);
				if (targetSelector === null) {
					returnText += " ";
				} else if (targetSelector.hasAttribute("aria-label")) {
					returnText += `${targetSelector.getAttribute("aria-label")}`;
				} else {
					returnText += `${targetSelector.firstChild.nodeValue} `;
				}
			});
			return returnText;
		}
		return "";
	}
	// Child with aria-label
	if (
		Array.from(el.children).filter((x) => x.matches("[aria-label]")).length > 0
	) {
		const child = Array.from(el.childNodes);
		let returnText = "";

		// Process each child within node.
		child.forEach((x) => {
			if (x.nodeType === 1) {
				if (x.ariaLabel === null) {
					returnText += x.innerText;
				} else {
					returnText += x.getAttribute("aria-label");
				}
			} else {
				returnText += x.nodeValue;
			}
		});
		return returnText;
	}
	// Child with aria-labelledby
	if (
		Array.from(el.children).filter((x) => x.matches("[aria-labelledby]"))
			.length > 0
	) {
		const child = Array.from(el.childNodes);
		let returnText = "";

		// Process each child within node.
		child.forEach((y) => {
			if (y.nodeType === 3) {
				returnText += y.nodeValue;
			} else {
				const target = y.getAttribute("aria-labelledby").split(/\s+/);
				if (target.length > 0) {
					let returnAria = "";
					target.forEach((z) => {
						if (document.querySelector(`#${z}`) === null) {
							returnAria += " ";
						} else {
							returnAria += `${
								document.querySelector(`#${z}`).firstChild.nodeValue
							} `;
						}
					});
					returnText += returnAria;
				}
			}
			return "";
		});
		return returnText;
	}
	return "noAria";
};

const nudge = () => {
	const sa11yInstance = document.querySelectorAll(
		".sa11y-instance, .sa11y-instance-inline"
	);
	sa11yInstance.forEach(($el) => {
		const sibling = $el.nextElementSibling;
		if (
			sibling !== null &&
			(sibling.classList.contains("sa11y-instance") ||
				sibling.classList.contains("sa11y-instance-inline"))
		) {
			sibling
				.querySelector("button")
				.setAttribute("style", "margin: -10px -20px !important;");
		}
	});
};

const detectOverflow = () => {
	const findParentWithOverflow = (element, property, value) => {
		let $el = element;
		while ($el !== null) {
			const style = window.getComputedStyle($el);
			const propValue = style.getPropertyValue(property);
			if (propValue === value) {
				return $el;
			}
			$el = $el.parentElement;
		}
		return null;
	};
	const $findButtons = document.querySelectorAll(".sa11y-btn");
	$findButtons.forEach(($el) => {
		const overflowing = findParentWithOverflow($el, "overflow", "hidden");
		if (overflowing !== null) {
			overflowing.classList.add("sa11y-overflow");
		}
	});
};

export {
	detectOverflow,
	nudge,
	computeAriaLabel,
	debounce,
	fnIgnore,
	escapeHTML,
	offsetTop,
	findVisibleParent,
	sanitizeForHTML,
	computeTextNodeWithImage,
	isElementHidden,
	headerIgnore,
	readabilityIgnore,
	containerIgnore,
	contrastIgnore,
	linkIgnore,
	imageIgnore,
};
