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