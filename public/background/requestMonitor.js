const API = browser || chrome;

const urlsToMonitor = [];
const domainsToMonitor = [
    "*://mail.notes.collabservintegration.com",
    "*://mail.notes.na.collabserv.com",
    "*://mail.notes.ap.collabserv.com",
    "*://mail.notes.ce.collabserv.com",
    "*://mail.notes.scniris.com",
    "*://mail.notes.collabservsvt2.swg.usma.ibm.com",
    "*://llc1mail.notes.collabservsvt1.swg.usma.ibm.com"
];
const pathsToMonitor = [
    '/*($Calendar)*',
    '/*iNotes/Proxy*',
    '/*$new*',
];
let calculating = false;

const year = new Date().getFullYear();
const firstDay = year + '0101T000000';
const lastDay = year + '1231T235959';
const path = '/livemail/iNotes/Proxy/?OpenDocument&Form=s_ReadViewEntries_JSON&Count=-1&KeyType=time&StartKey=' + firstDay + '%2C00Z&UntilKey=' + lastDay + '%2C00Z&PresetFields=FolderName%3B(%24CSAPIs)&xhr=1&sq=1';

function getCurrentTab() {
    return API.tabs.query({active: true, currentWindow: true});
}

function getTabs() {
    return API.tabs.query({url: domainsToMonitor.map(d => d+'/verse*')});
}

function sendRefreshMessage(year, leftVacation, leftWorkReduction) {
    getTabs().then((tabs) => {
        for (const tab of tabs) {
            API.tabs.sendMessage(tab.id, {refresh: true, tab: tab.id, year, leftVacation, leftWorkReduction});
        }
    }).catch((error) => {
        console.error('sendRefreshMessage', error);
    });
}

function manageEntries(entries, vacationRegex, reductionRegex) {
    let countVacation = 0;
    let countWorkReduction = 0;

    for (const e of entries) {
        const entry = new CalendarEntry(e);
        if (SUPPORTED_TYPES.includes(entry.type)) {
            if (vacationRegex.test(entry.subject)) {
                if (entry.durationHours > 4) {
                    countVacation += 1;
                } else {
                    countVacation += 0.5;
                }
            } else if (reductionRegex.test(entry.subject)) {
                if (entry.durationHours > 8) {
                    countWorkReduction += 8;
                } else if (entry.durationHours > 4) {
                    countWorkReduction += entry.durationHours - 1;
                } else {
                    countWorkReduction += entry.durationHours;
                }
            }
        }
    }

    return {countVacation, countWorkReduction};
}

function calculate() {
    if (!calculating) {
        calculating = true;

        let totalVacation = 0;
        let totalWorkReduction = 0;
        let vacationRegex = new RegExp('ferie','i');
        let reductionRegex = new RegExp('permesso|rol','i');
        API.storage.sync.get(['vacationDays','workReductionHours','vacationRegex','reductionRegex']).then((data) => {
            totalVacation = data.hasOwnProperty('vacationDays') ? data.vacationDays : totalVacation;
            totalWorkReduction = data.hasOwnProperty('workReductionHours') ? data.workReductionHours : totalWorkReduction;
            vacationRegex = data.hasOwnProperty('vacationRegex') ? new RegExp(data.vacationRegex, 'i') : vacationRegex;
            reductionRegex = data.hasOwnProperty('reductionRegex') ? new RegExp(data.reductionRegex, 'i') : reductionRegex;
            return getCurrentTab();
        }).then((tabs) => {
            const url = new URL(tabs[0].url);
            return fetch(url.origin + path);
        }).then((response) => {
            return response.json();
        }).then((json) => {
            calculating = false;

            const {countVacation, countWorkReduction} = manageEntries(json.entries.viewentry, vacationRegex, reductionRegex);
            const leftVacation = totalVacation - countVacation;
            const leftWorkReduction = totalWorkReduction - countWorkReduction;
            // console.log('calculate leftVacation', leftVacation);
            // console.log('calculate leftWorkReduction', leftWorkReduction);
            sendRefreshMessage(year, leftVacation, leftWorkReduction);
        }).catch((error) => {
            calculating = false;

            console.error('calculate', error);
            console.error(error);
        });
    }
}

for (const d of domainsToMonitor) {
    for (const p of pathsToMonitor) {
        urlsToMonitor.push(d+p);
    }
}

API.webRequest.onCompleted.addListener((details) => {
    // skip refresh if monitored url is reading calendar entries
    if (details.url.includes(path)) {
        return;
    }

    // console.log('webRequest.onCompleted url:', details.url);
    calculate();
}, {urls: urlsToMonitor, types: ['xmlhttprequest']});
