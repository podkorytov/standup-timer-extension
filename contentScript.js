let timerFrame = null;

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "createTimer") {
        createTimerUI(request.teamMembers);
        sendResponse({ status: "Timer UI created" });
    }
    return true;
});

// Function to create the timer UI iframe
function createTimerUI(teamMembers) {
    // Remove existing timer frame if it exists
    if (timerFrame) {
        timerFrame.remove();
    }

    // Create an iframe to host the timer UI
    timerFrame = document.createElement('iframe');
    timerFrame.style.position = 'fixed';
    timerFrame.style.top = '20px';
    timerFrame.style.right = '20px';
    timerFrame.style.width = '300px';
    timerFrame.style.height = '400px';
    timerFrame.style.border = '1px solid #ccc';
    timerFrame.style.borderRadius = '5px';
    timerFrame.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    timerFrame.style.zIndex = '9999';
    timerFrame.style.backgroundColor = 'white';
    timerFrame.src = chrome.runtime.getURL('timer.html');

    document.body.appendChild(timerFrame);

    // Wait for iframe to load, then send team members data
    timerFrame.onload = function () {
        timerFrame.contentWindow.postMessage({
            action: 'loadTeamMembers',
            teamMembers: teamMembers,
            source: 'standup-timer-extension'
        }, '*');
    };

    // Make the iframe draggable
    makeFrameDraggable(timerFrame);
}

// Function to make the iframe draggable
function makeFrameDraggable(frame) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isDragging = false;
    let dragArea = null;

    // Listen for messages from the iframe
    window.addEventListener('message', function (event) {
        if (event.data.action === 'dragStart' && event.data.source === 'standup-timer-extension') {
            isDragging = true;
            pos3 = event.data.clientX;
            pos4 = event.data.clientY;
            document.addEventListener('mousemove', elementDrag);
            document.addEventListener('mouseup', closeDragElement);
        }
    });

    function elementDrag(e) {
        if (!isDragging) return;

        e.preventDefault();
        // Calculate new position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        // Set the iframe's new position
        frame.style.top = (frame.offsetTop - pos2) + "px";
        frame.style.left = (frame.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        isDragging = false;
        document.removeEventListener('mousemove', elementDrag);
        document.removeEventListener('mouseup', closeDragElement);
    }
}