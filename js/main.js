try {
    // setup listener from background process
    API.runtime.onMessage.addListener((data) => {
        if (data.refresh) {
            calculate(data.tab);
        }
    });
} catch (error) {
    console.error('MAIN ERROR', error);
}