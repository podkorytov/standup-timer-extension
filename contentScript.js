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
    timerFrame.style.top = '0px';
    timerFrame.style.left = '0px';
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
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;

    // Listen for messages from the iframe
    window.addEventListener('message', function (event) {
        if (event.data.action === 'dragStart' && event.data.source === 'standup-timer-extension') {
            isDragging = true;

            // Calculate the offset between mouse position and iframe position
            const frameRect = frame.getBoundingClientRect();
            offsetX = event.data.clientX - frameRect.left;
            offsetY = event.data.clientY - frameRect.top;

            // Add event listeners to the document
            document.addEventListener('mousemove', elementDrag);
            document.addEventListener('mouseup', closeDragElement);
        }
    });

    function elementDrag(e) {
        if (!isDragging) return;

        e.preventDefault();

        // Calculate the new position based on the mouse position minus the offset
        const newX = e.clientX - offsetX;
        const newY = e.clientY - offsetY;

        // Make sure the frame stays within viewport bounds
        const maxX = window.innerWidth - frame.offsetWidth;
        const maxY = window.innerHeight - frame.offsetHeight;

        // Set new position with bounds checking
        frame.style.left = Math.min(Math.max(0, newX), maxX) + 'px';
        frame.style.top = Math.min(Math.max(0, newY), maxY) + 'px';
    }

    function closeDragElement() {
        isDragging = false;
        document.removeEventListener('mousemove', elementDrag);
        document.removeEventListener('mouseup', closeDragElement);
    }
}