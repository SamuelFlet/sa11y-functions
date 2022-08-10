let option = {
	checkRoot: "body",
	containerIgnore: ".sa11y-ignore",
	contrastIgnore: ".sr-only",
	outlineIgnore: "",
	headerIgnore: "",
	imageIgnore: "",
	linkIgnore: 'nav *, [role="navigation"] *',
	linkIgnoreSpan: "",
	linksToFlag: "",
	nonConsecutiveHeadingIsError: true,
	flagLongHeadings: true,
	showGoodLinkButton: true,
	detectSPArouting: false,
	doNotRun: "",

	// Readability
	readabilityPlugin: true,
	readabilityRoot: "body",
	readabilityLang: "en",
	readabilityIgnore: "",

	// Other plugins
	contrastPlugin: true,
	formLabelsPlugin: true,
	linksAdvancedPlugin: true,
	customChecks: true,

	// QA rulesets
	badLinksQA: true,
	strongItalicsQA: true,
	pdfQA: true,
	langQA: true,
	blockquotesQA: true,
	tablesQA: true,
	allCapsQA: true,
	fakeHeadingsQA: true,
	fakeListQA: true,
	duplicateIdQA: true,
	underlinedTextQA: true,
	pageTitleQA: true,

	// Embedded content rulesets
	embeddedContentAll: true,
	embeddedContentAudio: true,
	embeddedContentVideo: true,
	embeddedContentTwitter: true,
	embeddedContentDataViz: true,
	embeddedContentTitles: true,
	embeddedContentGeneral: true,

	// Embedded content
	videoContent: "youtube.com, vimeo.com, yuja.com, panopto.com",
	audioContent:
		"soundcloud.com, simplecast.com, podbean.com, buzzsprout.com, blubrry.com, transistor.fm, fusebox.fm, libsyn.com",
	dataVizContent: "datastudio.google.com, tableau",
	twitterContent: "twitter-timeline",
	embeddedContent: `youtube.com, vimeo.com, yuja.com, panopto.com, soundcloud.com, simplecast.com, podbean.com, buzzsprout.com, blubrry.com, transistor.fm, fusebox.fm, libsyn.com, datastudio.google.com, tableau,twitter-timeline`,
};
export { option };
