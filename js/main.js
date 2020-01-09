document.body.style.border = "5px solid red";
try {
    // setup listener from background process
    browser.runtime.onMessage.addListener((data) => {
        console.log('ON MESSAGE');
        if (data.refresh) {
            calculate(data.tab);
        }
    });
} catch (error) {
    console.error('MAIN ERROR', error);
}