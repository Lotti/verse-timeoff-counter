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
    browser.tabs.query({url: domainsToMonitor.map(d => d+'/verse*')}).then((tabs) => {
        for (const tab of tabs) {
            setTimeout(() => {
                browser.tabs.sendMessage(tab.id, {refresh: true, tab: tab.id});
            }, refreshDelay);
        }
    }).catch((error) => {
        console.error('sendRefreshMessage', error);
    });
}

function manageMonitoredCall(details) {
    // skip refresh if monitored url is reading calendar entries
    if (details.url.includes('/livemail/iNotes/Proxy/?OpenDocument&Form=s_ReadViewEntries_JSON&Count=-1&KeyType=time&StartKey')) {
        return;
    }
    sendRefreshMessage();
}

for (const d of domainsToMonitor) {
    for (const p of pathsToMonitor) {
        urlsToMonitor.push(d+p);
    }
}

browser.webRequest.onCompleted.addListener(manageMonitoredCall, {urls: urlsToMonitor, types: ['xmlhttprequest']});
