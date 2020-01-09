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

const refreshDelay = 500;
function sendRefreshMessage() {
    API.tabs.query({url: domainsToMonitor.map(d => d+'/verse*')}).then((tabs) => {
        for (const tab of tabs) {
            setTimeout(() => {
                API.tabs.sendMessage(tab.id, {refresh: true, tab: tab.id});
            }, refreshDelay);
        }
    }).catch((error) => {
        console.error('sendRefreshMessage', error);
    });
}

function manageMonitoredCall(details) {
    // skip refresh if monitored url is reading calendar entries
    const year = new Date().getFullYear();
    const firstDay = year + '0101T000000';
    const lastDay = year + '1231T235959';
    const path = '/livemail/iNotes/Proxy/?OpenDocument&Form=s_ReadViewEntries_JSON&Count=-1&KeyType=time&StartKey=' + firstDay + '%2C00Z&UntilKey=' + lastDay + '%2C00Z&PresetFields=FolderName%3B(%24CSAPIs)&xhr=1&sq=1';

    if (details.url.includes(path)) {
        return;
    }
    sendRefreshMessage();
}

for (const d of domainsToMonitor) {
    for (const p of pathsToMonitor) {
        urlsToMonitor.push(d+p);
    }
}

API.webRequest.onCompleted.addListener(manageMonitoredCall, {urls: urlsToMonitor, types: ['xmlhttprequest']});
