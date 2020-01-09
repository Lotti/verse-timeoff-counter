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

function calculate(tabId, totalVacation, totalWorkReduction, year) {
	if (!calculating) {
		calculating = true;

		let countVacation = 0;
		let countWorkReduction = 0;

		if (!totalVacation) {
			totalVacation = 0;
		}
		if (!totalWorkReduction) {
			totalWorkReduction = 0;
		}
		if (!year) {
			year = new Date().getFullYear();
		}

		const url = new URL(window.location.href);
		fetch(url.origin + '/livemail/iNotes/Proxy/?OpenDocument&Form=s_ReadViewEntries_JSON&Count=-1&KeyType=time&StartKey=' + year + '0101T000000%2C00Z&UntilKey=' + year + '1231T235959%2C00Z&PresetFields=FolderName%3B(%24CSAPIs)&xhr=1&sq=1').then((response) => {
			return response.json();
		}).then((json) => {
			calculating = false;

			for (const e of json.entries.viewentry) {
				for (const data of e.entrydata) {
					const keys = Object.keys(data);
					if (data["@name"] === "$Subject" && data.text[0].includes("FERIE")) {
						countVacation++;
					} else if (data["@name"] === "$Subject" && data.text[0].includes("PERMESSO")) {
						countWorkReduction++;
					}
				}
			}

			console.log('tabId', tabId, 'FERIE', countVacation);
			console.log('tabId', tabId, 'PERMESSI', countWorkReduction);

			const leftVacation = totalVacation - countVacation;
			const leftWorkReduction = totalWorkReduction - countWorkReduction;
			interval = setInterval(() => updateUI(year, leftVacation, leftWorkReduction), 500);
		}).catch((error) => {
			calculating = false;
			console.error("calculate", error);
		});
	}
}