const API = browser || chrome;

let calculating = false;
let interval;

function updateUI(year, leftVacation, leftWorkReduction) {
	const dom = document.querySelector('.navcenter');
	if (dom) {
		leftVacation = leftVacation < 0 ? '<span class="red">'+leftVacation+'</span>' : leftVacation;
		leftWorkReduction = leftWorkReduction < 0 ? '<span class="red">'+leftWorkReduction+'</span>' : leftWorkReduction;

		try {
			const element = document.getElementById("vacations");
			if (element) {
				element.parentNode.removeChild(element);
			}

			const d = document.createElement("div");
			d.setAttribute("id", "vacations");
			const html = '<span id="year">Year: ' + year + '</span>&nbsp;&nbsp;&nbsp;<span id="ferie">Vacations Left: ' + leftVacation + '</span>&nbsp;&nbsp;&nbsp;<span id="permessi">Work Reduction Left: ' + leftWorkReduction + '</span>';
			d.innerHTML = DOMPurify.sanitize(html);
			dom.appendChild(d);
		} catch (error) {
			console.error("updateUI", error);
		}

		if (interval) {
			clearInterval(interval);
		}
	}
}

function manageEntries(entries, vacationRegex, reductionRegex) {
	let countVacation = 0;
	let countWorkReduction = 0;

	for (const e of entries) {
		for (const data of e.entrydata) {
			const keys = Object.keys(data);
			if (data["@name"] === "$Subject" && vacationRegex.test(data.text[0])) {
				countVacation++;
			} else if (data["@name"] === "$Subject" && reductionRegex.test(data.text[0])) {
				countWorkReduction+= 8;
			}
		}
	}

	return {countVacation, countWorkReduction};
}

function calculate(tabId) {
	if (!calculating) {
		calculating = true;

		const year = new Date().getFullYear();
		let totalVacation = 0;
		let totalWorkReduction = 0;
		let vacationRegex = new RegExp('ferie','i');
		let reductionRegex = new RegExp('permesso','i');

		API.storage.sync.get(['vacationDays','workReductionHours','vacationRegex','reductionRegex']).then((data) => {
			totalVacation = data.hasOwnProperty('vacationDays') ? data.vacationDays : totalVacation;
			totalWorkReduction = data.hasOwnProperty('workReductionHours') ? data.workReductionHours : totalWorkReduction;
			vacationRegex = data.hasOwnProperty('vacationRegex') ? new RegExp(data.vacationRegex, 'i') : vacationRegex;
			reductionRegex = data.hasOwnProperty('reductionRegex') ? new RegExp(data.reductionRegex, 'i') : reductionRegex;

			const url = new URL(window.location.href);
			const path = '/livemail/iNotes/Proxy/?OpenDocument&Form=s_ReadViewEntries_JSON&Count=-1&KeyType=time&StartKey=' + year + '0101T000000%2C00Z&UntilKey=' + year + '1231T235959%2C00Z&PresetFields=FolderName%3B(%24CSAPIs)&xhr=1&sq=1';
			return fetch(url.origin + path);
		}).then((response) => {
			return response.json();
		}).then((json) => {
			calculating = false;

			const {countVacation, countWorkReduction} = manageEntries(json.entries.viewentry, vacationRegex, reductionRegex);

			console.log('tabId', tabId, 'VACATION COUNT', countVacation);
			console.log('tabId', tabId, 'WORK REDUCTION COUNT', countWorkReduction);

			const leftVacation = totalVacation - countVacation;
			const leftWorkReduction = totalWorkReduction - countWorkReduction;
			interval = setInterval(() => updateUI(year, leftVacation, leftWorkReduction), 500);
		}).catch((error) => {
			calculating = false;
			console.error("calculate", error);
		});
	}
}