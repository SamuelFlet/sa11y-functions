import english from "./en.js";
import french from "./fr.js";
import polish from "./pl.js";
import ukrainian from "./ua.js";
function findLanguage() {
	let language = document.getElementsByTagName("html")[0].getAttribute("lang");
	if (language === "en") {
		return english;
	} else if (language === "fr"){
        return french;
    }else if (language === "pl"){
        return polish;
    }else if (language === "ua"){
        return ukrainian;
    }
}

const Lang = {
	langStrings: findLanguage(),
	addI18n(strings) {
	  this.langStrings = strings;
	},
	_(string) {
	  return this.translate(string);
	},
	sprintf(string, ...args) {
	  let transString = this._(string);
	  if (args && args.length) {
		args.forEach((arg) => {
		  transString = transString.replace(/%\([a-zA-z]+\)/, arg);
		});
	  }
	  return transString;
	},
	translate(string) {
	  return this.langStrings["strings"][string] || string;
	},
  };
export { Lang };
