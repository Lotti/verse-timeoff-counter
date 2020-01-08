
function calculate(totalVacation, totalWorkReduction, year) {
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

	fetch('https://mail.notes.na.collabserv.com/livemail/iNotes/Proxy/?OpenDocument&Form=s_ReadViewEntries_JSON&Count=-1&KeyType=time&StartKey='+year+'0101T000000%2C00Z&UntilKey='+year+'1231T235959%2C00Z&PresetFields=FolderName%3B(%24CSAPIs)&xhr=1&sq=1').then((response) => {
		return response.json();
	}).then((json) => {

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

		const leftVacation = totalVacation - countVacation;
		const leftWorkReduction = totalWorkReduction - countWorkReduction;

		let interval;
		const updateUI = () => {
			const doms = document.querySelector('.navcenter');
			if (doms) {
				console.log('FERIE', countVacation);
				console.log('PERMESSI', countWorkReduction);
				try {
					const doms = document.querySelector('.navcenter');
					const element = document.getElementById("vacations");
					if (element) {
						element.parentNode.removeChild(element);
					}

					const d = document.createElement("div");
					d.setAttribute("id", "vacations");
					d.innerHTML = '<span id="year">ANNO: ' + year + '</span> <span id="ferie">FERIE: ' + leftVacation + '</span> <span id="permessi">PERMESSI: ' + leftWorkReduction + '</span>';
					doms.appendChild(d);
				} catch (error) {
					console.error("ERRORE!");
					console.error(error);
				}
				clearInterval(interval);
			}
		};

		interval = setInterval(() => updateUI(), 500);
	}).catch((error) => {
		console.error("ERRORE!");
		console.error(error);
	});
}