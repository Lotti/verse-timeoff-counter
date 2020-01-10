const API = browser || chrome;

function updateUI(tabId, year, leftVacation, leftWorkReduction) {
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
            console.error('tabId', tabId, 'updateUI', error);
        }
    }
}

try {
    // setup listener from background process
    API.runtime.onMessage.addListener((data) => {
        if (data.refresh) {
            updateUI(data.tabId, data.year, data.leftVacation, data.leftWorkReduction);
        }
    });
} catch (error) {
    console.error('MAIN ERROR', error);
}