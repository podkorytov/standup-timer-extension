let teamMembers = [];
let activeTimerId = null;
let timers = {};
let previousMeetingData = {};

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

// Initialize timers
function initializeTimers() {
    // Load previous meeting data if available
    chrome.storage.local.get(['previousMeetingData'], function (result) {
        if (result.previousMeetingData) {
            previousMeetingData = JSON.parse(result.previousMeetingData);

            // Sort team members based on previous meeting speaking time
            sortTeamMembers();
        } else {
            // If no previous meeting data, sort alphabetically by name
            teamMembers.sort((a, b) => a.name.localeCompare(b.name));
        }

        renderTeamMembers();
        setupEndMeetingButton();
        setupClearStatsButton();
    });
}

// Sort team members by previous meeting time or alphabetically if no data
function sortTeamMembers() {
    teamMembers.sort((a, b) => {
        const timeA = previousMeetingData[a.name] || 0;
        const timeB = previousMeetingData[b.name] || 0;

        if (timeA === 0 && timeB === 0) {
            // If both have no previous time, sort alphabetically
            return a.name.localeCompare(b.name);
        }

        // Sort by speaking time (descending)
        return timeB - timeA;
    });
}

// Format seconds into MM:SS format
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
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

        // Create container for all time information
        const timeInfoDiv = document.createElement('div');
        timeInfoDiv.className = 'time-info';

        // Current meeting time
        const timeSpan = document.createElement('span');
        timeSpan.className = 'member-time';
        timeSpan.id = `time-${member.name.replace(/\s+/g, '-')}`;
        timeSpan.textContent = '00:00';

        // Previous meeting time (if available)
        const previousTimeSpan = document.createElement('span');
        previousTimeSpan.className = 'previous-time';

        if (previousMeetingData[member.name]) {
            previousTimeSpan.textContent = `Previous: ${formatTime(previousMeetingData[member.name])}`;
        } else {
            previousTimeSpan.textContent = 'No previous data';
            previousTimeSpan.classList.add('no-data');
        }

        timeInfoDiv.appendChild(timeSpan);
        timeInfoDiv.appendChild(previousTimeSpan);
        infoDiv.appendChild(timeInfoDiv);

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
    timeSpan.textContent = formatTime(totalSeconds);
}

// Set up End Meeting button
function setupEndMeetingButton() {
    document.getElementById('endMeeting').addEventListener('click', function () {
        // First, pause any active timer
        if (activeTimerId !== null) {
            pauseTimer(activeTimerId);
        }

        // Create an updated record of all times
        // Important: Preserve previous data for members who didn't speak (0 seconds)
        const updatedMeetingData = { ...previousMeetingData }; // Start with previous data

        Object.keys(timers).forEach(memberName => {
            const speakingTime = timers[memberName].totalSeconds;
            // Only update if the member spoke during this meeting
            if (speakingTime > 0) {
                updatedMeetingData[memberName] = speakingTime;
            }
        });

        // Save to storage
        chrome.storage.local.set({
            previousMeetingData: JSON.stringify(updatedMeetingData)
        }, function () {
            // Update our local copy of the data
            previousMeetingData = updatedMeetingData;

            // Sort team members based on updated data
            sortTeamMembers();

            // Reset all timers
            Object.keys(timers).forEach(memberName => {
                timers[memberName].totalSeconds = 0;
            });

            // Re-render the team members list
            renderTeamMembers();

            // Show completion message
            alert('Meeting ended! Team members have been sorted by speaking time for the next meeting.');
        });
    });
}

// Set up Clear Statistics button
function setupClearStatsButton() {
    document.getElementById('clearStats').addEventListener('click', function () {
        if (confirm('Are you sure you want to clear all meeting statistics?')) {
            // Clear data in storage
            chrome.storage.local.remove(['previousMeetingData'], function () {
                // Clear local data
                previousMeetingData = {};

                // Sort alphabetically
                teamMembers.sort((a, b) => a.name.localeCompare(b.name));

                // Reset all timers
                Object.keys(timers).forEach(memberName => {
                    timers[memberName].totalSeconds = 0;
                });

                // Re-render the team members list
                renderTeamMembers();
            });
        }
    });
}