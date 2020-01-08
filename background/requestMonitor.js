function sendRefreshMessage(details) {
    let block = false;
    let delay = false;

    // check for event delete in pop-up window
    if (details.url.includes('.nsf')) {
        delay = true;
        if (!(details.url.includes('OpenDocument') && details.url.includes('s_ReadPartStatus'))) {
            block = true;
        }
    }

    if (!block) {
        console.log('sendRefreshMessage url:', details.url);

        browser.tabs.query({
            url: [
                "*://mail.notes.collabservintegration.com/verse*",
                "*://mail.notes.na.collabserv.com/verse*",
                "*://mail.notes.ap.collabserv.com/verse*",
                "*://mail.notes.ce.collabserv.com/verse*",
                "*://mail.notes.scniris.com/verse*",
                "*://mail.notes.collabservsvt2.swg.usma.ibm.com/verse*",
                "*://llc1mail.notes.collabservsvt1.swg.usma.ibm.com/verse*"
            ]
        }).then((tabs) => {
            for (const tab of tabs) {
                if (!block) {
                    setTimeout(() => {
                        browser.tabs.sendMessage(tab.id, {refresh: true});
                    }, delay ? 500 : 500);
                }
            }
        }).catch((error) => {
            console.error('sendRefreshMessage', error);
        });
    }
}

browser.webRequest.onCompleted.addListener(sendRefreshMessage, {
    urls: [
        '*://*/*($Calendar)/$new/*', // calendar url create
        '*://*/*($Calendar)/*EditDocument*', // calendar url edit
        '*://*/*.nsf*', // url to monitor event pop-up window from verse timeline
    ],
    types: ['xmlhttprequest']
});

const checkAction = () => {
    browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
        for (const tab of tabs) {
            if (tab.url && tab.url.length > 0 && tab.url.includes('/verse')) {
                browser.browserAction.enable();
            } else {
                browser.browserAction.disable();
            }
        }
    });
};

browser.tabs.onCreated.addListener(checkAction);
browser.tabs.onUpdated.addListener(checkAction);