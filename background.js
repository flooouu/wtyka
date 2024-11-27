// background.js
chrome.browserAction.onClicked.addListener((tab) => {
    chrome.windows.create({
        url: chrome.runtime.getURL('popup.html'), 
        type: 'popup',
        width: 400, 
        height: 600 
    });
});


