document.body.style.border = "5px solid red";

console.log('ciao');
let count_ferie = 0;
let count_permessi = 0;

const year = new Date().getFullYear();


fetch('https://mail.notes.na.collabserv.com/livemail/iNotes/Proxy/?OpenDocument&Form=s_ReadViewEntries_JSON&Count=-1&KeyType=time&StartKey='+year+'0101T000000%2C00Z&UntilKey='+year+'1231T235959%2C00Z&PresetFields=FolderName%3B(%24CSAPIs)&xhr=1&sq=1').then((response) => {
  return response.json();
}).then((json) => {

	for (const e of json.entries.viewentry) {
		for (const data of e.entrydata) {
			const keys = Object.keys(data);
			if (data["@name"] === "$Subject" && data.text[0].includes("FERIE")) {
				count_ferie++;
			} else if (data["@name"] === "$Subject" && data.text[0].includes("PERMESSO")) {
				count_permessi++;
			}
		}
	}

	setTimeout(() => {
		console.log('FERIE', count_ferie);
		console.log('PERMESSI', count_permessi);		
		try {
			const doms = document.querySelector('.navcenter');
			console.log('DOMS', doms);

			const element = document.getElementById("vacations");
			if (element) {
				element.parentNode.removeChild(element);
			}

			const d = document.createElement("div");
			d.setAttribute("id", "vacations");
			d.innerHTML = '<span id="year">ANNO: '+year+'</span> <span id="ferie">FERIE: '+count_ferie+'</span> <span id="permessi">PERMESSI: '+count_permessi+'</span>';
			doms.appendChild(d);	
		} catch (error) {
			console.error("ERRORE!");
			console.error(error);
		}
	}, 5000);
}).catch((error) => {
	console.error("ERRORE!");
	console.error(error);
});