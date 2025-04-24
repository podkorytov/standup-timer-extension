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

    // Create a container for the timer that will handle drag events
    const container = document.createElement('div');
    container.id = 'standup-timer-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.width = '300px';
    container.style.zIndex = '9999';
    container.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    container.style.borderRadius = '5px';
    container.style.backgroundColor = 'white';
    container.style.overflow = 'hidden';

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
    timerFrame.style.height = '370px';
    timerFrame.style.border = 'none';
    timerFrame.src = chrome.runtime.getURL('timer.html');

    // Assemble the container
    container.appendChild(dragHandle);
    container.appendChild(timerFrame);
    document.body.appendChild(container);

    // Wait for iframe to load, then send team members data
    timerFrame.onload = function () {
        timerFrame.contentWindow.postMessage({
            action: 'loadTeamMembers',
            teamMembers: teamMembers,
            source: 'standup-timer-extension'
        }, '*');
    };

    // Make the container draggable
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    // Handle drag start
    dragHandle.addEventListener("mousedown", dragStart, false);

    // Handle drag events
    document.addEventListener("mousemove", drag, false);
    document.addEventListener("mouseup", dragEnd, false);

    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        isDragging = true;
        e.preventDefault();
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();

            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            // Apply new position
            setTranslate(currentX, currentY, container);
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;

        isDragging = false;
    }

    function setTranslate(xPos, yPos, el) {
        // Ensure container stays within viewport bounds
        const containerRect = el.getBoundingClientRect();
        const maxX = window.innerWidth - containerRect.width;
        const maxY = window.innerHeight - containerRect.height;

        xPos = Math.min(Math.max(0, xPos), maxX);
        yPos = Math.min(Math.max(0, yPos), maxY);

        el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
    }
}