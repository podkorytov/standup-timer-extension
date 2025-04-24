// contentScript.js
let timerFrame = null;
let timerContainer = null;

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
    if (timerContainer) {
        timerContainer.remove();
    }

    // Create a container for the timer that will handle drag events
    timerContainer = document.createElement('div');
    timerContainer.id = 'standup-timer-container';
    timerContainer.style.position = 'fixed';
    timerContainer.style.top = '20px';
    timerContainer.style.right = '20px';
    timerContainer.style.width = '300px';
    timerContainer.style.zIndex = '9999';
    timerContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    timerContainer.style.borderRadius = '5px';
    timerContainer.style.backgroundColor = 'white';
    timerContainer.style.overflow = 'hidden';

    // Create a drag handle at the top of the container
    const dragHandle = document.createElement('div');
    dragHandle.style.width = '100%';
    dragHandle.style.height = '30px';
    dragHandle.style.backgroundColor = '#4285f4';
    dragHandle.style.cursor = 'move';
    dragHandle.style.color = 'white';
    dragHandle.style.display = 'flex';
    dragHandle.style.alignItems = 'center';
    dragHandle.style.justifyContent = 'space-between';
    dragHandle.style.padding = '0 10px';
    dragHandle.style.fontFamily = 'Arial, sans-serif';
    dragHandle.style.fontSize = '14px';
    dragHandle.style.fontWeight = 'bold';
    dragHandle.style.userSelect = 'none';
    dragHandle.textContent = 'Standup Timer';

    // Add drag handle icon
    const dragIcon = document.createElement('span');
    dragIcon.textContent = '☰';
    dragIcon.style.cursor = 'move';
    dragHandle.appendChild(dragIcon);

    // Create the iframe to host the timer UI
    timerFrame = document.createElement('iframe');
    timerFrame.style.width = '100%';
    timerFrame.style.height = '400px'; // Increased height for the "End Meeting" button
    timerFrame.style.border = 'none';
    timerFrame.src = chrome.runtime.getURL('timer.html');

    // Assemble the container
    timerContainer.appendChild(dragHandle);
    timerContainer.appendChild(timerFrame);
    document.body.appendChild(timerContainer);

    // Wait for iframe to load, then send team members data
    timerFrame.onload = function () {
        timerFrame.contentWindow.postMessage({
            action: 'loadTeamMembers',
            teamMembers: teamMembers,
            source: 'standup-timer-extension'
        }, '*');
    };

    // Make the container draggable using mouse events
    let isDragging = false;
    let startX, startY;

    function getTransformedPosition() {
        const style = window.getComputedStyle(timerContainer);
        const matrix = new DOMMatrix(style.transform);
        return { x: matrix.m41, y: matrix.m42 };
    }

    dragHandle.addEventListener('mousedown', function (e) {
        isDragging = true;

        // Get current position from transform or default to 0,0
        const currentPos = getTransformedPosition();

        // Calculate the starting mouse position relative to the container position
        startX = e.clientX - currentPos.x;
        startY = e.clientY - currentPos.y;

        e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
        if (!isDragging) return;

        // Calculate the new position
        let newX = e.clientX - startX;
        let newY = e.clientY - startY;

        // Apply constraints to keep the container in the viewport
        const maxX = window.innerWidth - timerContainer.offsetWidth;
        const maxY = window.innerHeight - timerContainer.offsetHeight;

        newX = Math.min(Math.max(0, newX), maxX);
        newY = Math.min(Math.max(0, newY), maxY);

        // Set the new position using translate3d for better performance
        timerContainer.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
        timerContainer.style.right = 'auto'; // Clear the right property when dragging
    });

    document.addEventListener('mouseup', function () {
        isDragging = false;
    });
}