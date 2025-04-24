let teamMembers = [];
let activeTimerId = null;
let timers = {};
let sortedByPreviousMeeting = false;

// Listen for messages from the parent window
window.addEventListener('message', function (event) {
    // Only accept messages from our extension
    if (event.data.source === 'standup-timer-extension') {
        if (event.data.action === 'loadTeamMembers') {
            teamMembers = event.data.teamMembers;
            initializeTimers();
        }
    }
});

// Make the window draggable
document.addEventListener('DOMContentLoaded', function () {
    const dragHandle = document.querySelector('.drag-handle');

    dragHandle.addEventListener('mousedown', function (e) {
        // Send drag start event to parent window
        window.parent.postMessage({
            action: 'dragStart',
            clientX: e.clientX,
            clientY: e.clientY,
            source: 'standup-timer-extension'
        }, '*');

        e.preventDefault();
    });
});

// Initialize timers
function initializeTimers() {
    // Load previous meeting data if available
    chrome.storage.local.get(['previousMeetingData'], function (result) {
        if (result.previousMeetingData) {
            const previousData = JSON.parse(result.previousMeetingData);
            sortedByPreviousMeeting = true;

            // Sort team members based on previous meeting speaking time
            const sortedMembers = [...teamMembers];

            sortedMembers.sort((a, b) => {
                const timeA = previousData[a.name] || 0;
                const timeB = previousData[b.name] || 0;
                return timeB - timeA; // Sort by descending order
            });

            teamMembers = sortedMembers;
        }

        renderTeamMembers();
        setupEndMeetingButton();
    });
}

// Render team members list
function renderTeamMembers() {
    const container = document.getElementById('team-members-container');
    container.innerHTML = '';

    teamMembers.forEach(member => {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'team-member';

        const avatar = document.createElement('img');
        avatar.className = 'avatar';
        avatar.src = member.avatarUrl;
        avatar.alt = member.name;
        avatar.onerror = function () {
            // Set default avatar if URL fails to load
            this.src = 'data:image/svg+xml,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
          <circle cx="15" cy="15" r="15" fill="#ccc"/>
          <text x="15" y="20" font-family="Arial" font-size="14" text-anchor="middle" fill="#666">
            ${member.name.charAt(0)}
          </text>
        </svg>
      `);
        };

        memberDiv.appendChild(avatar);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'member-info';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'member-name';
        nameSpan.textContent = member.name;
        infoDiv.appendChild(nameSpan);

        const timeSpan = document.createElement('span');
        timeSpan.className = 'member-time';
        timeSpan.id = `time-${member.name.replace(/\s+/g, '-')}`;
        timeSpan.textContent = '00:00';
        infoDiv.appendChild(timeSpan);

        memberDiv.appendChild(infoDiv);

        const button = document.createElement('button');
        button.className = 'control-button';
        button.id = `button-${member.name.replace(/\s+/g, '-')}`;
        button.textContent = 'Start';
        button.addEventListener('click', () => toggleTimer(member.name));

        memberDiv.appendChild(button);
        container.appendChild(memberDiv);

        // Initialize timer data for this member
        timers[member.name] = {
            totalSeconds: 0,
            intervalId: null,
            isRunning: false
        };
    });
}

// Toggle timer for a team member
function toggleTimer(memberName) {
    // If this member's timer is already running, pause it
    if (timers[memberName].isRunning) {
        pauseTimer(memberName);
        return;
    }

    // If another timer is running, pause it first
    if (activeTimerId !== null) {
        pauseTimer(activeTimerId);
    }

    // Start this member's timer
    activeTimerId = memberName;
    timers[memberName].isRunning = true;

    // Update button text
    const button = document.getElementById(`button-${memberName.replace(/\s+/g, '-')}`);
    button.textContent = 'Pause';
    button.classList.add('active');

    // Start the interval
    timers[memberName].intervalId = setInterval(() => {
        timers[memberName].totalSeconds += 1;
        updateTimeDisplay(memberName);
    }, 1000);
}

// Pause timer for a team member
function pauseTimer(memberName) {
    if (!timers[memberName].isRunning) return;

    clearInterval(timers[memberName].intervalId);
    timers[memberName].isRunning = false;

    // Update button text
    const button = document.getElementById(`button-${memberName.replace(/\s+/g, '-')}`);
    button.textContent = 'Resume';
    button.classList.remove('active');

    // If this was the active timer, clear activeTimerId
    if (activeTimerId === memberName) {
        activeTimerId = null;
    }
}

// Update time display for a team member
function updateTimeDisplay(memberName) {
    const timeSpan = document.getElementById(`time-${memberName.replace(/\s+/g, '-')}`);
    const totalSeconds = timers[memberName].totalSeconds;

    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');

    timeSpan.textContent = `${minutes}:${seconds}`;
}

// Set up End Meeting button
function setupEndMeetingButton() {
    document.getElementById('endMeeting').addEventListener('click', function () {
        // First, pause any active timer
        if (activeTimerId !== null) {
            pauseTimer(activeTimerId);
        }

        // Create a record of all times
        const meetingData = {};
        Object.keys(timers).forEach(memberName => {
            meetingData[memberName] = timers[memberName].totalSeconds;
        });

        // Save to storage
        chrome.storage.local.set({ previousMeetingData: JSON.stringify(meetingData) });

        // Sort team members by speaking time
        teamMembers.sort((a, b) => {
            return timers[b.name].totalSeconds - timers[a.name].totalSeconds;
        });

        // Re-render the team members list
        renderTeamMembers();

        // Show completion message
        alert('Meeting ended! Team members have been sorted by speaking time for the next meeting.');
    });
}