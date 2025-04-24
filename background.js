chrome.runtime.onInstalled.addListener(() => {
    console.log('Standup Timer extension installed');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "timerCreated") {
        console.log("Timer UI created successfully");
    }
    return true;
});