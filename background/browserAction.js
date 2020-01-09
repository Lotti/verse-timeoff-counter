const checkAction = () => {
    API.tabs.query({currentWindow: true, active: true}).then((tabs) => {
        for (const tab of tabs) {
            if (tab.url && tab.url.length > 0 && tab.url.includes('/verse')) {
                API.browserAction.enable();
            } else {
                API.browserAction.disable();
            }
        }
    });
};

API.tabs.onCreated.addListener(checkAction);
API.tabs.onUpdated.addListener(checkAction);