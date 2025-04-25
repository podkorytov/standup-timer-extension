// Timer Class - manages the timer functionality
class StandupTimer {
    constructor() {
        this.teamMembers = [];
        this.activeTimerId = null;
        this.timers = {};
        this.previousMeetingData = {};

        this.init();
    }

    init() {
        this.setupMessageListener();
        this.setupEventListeners();
    }

    setupMessageListener() {
        window.addEventListener('message', (event) => {
            if (event.data.source === 'standup-timer-extension') {
                if (event.data.action === 'loadTeamMembers') {
                    this.teamMembers = event.data.teamMembers;
                    this.initializeTimers();
                }
            }
        });
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEndMeetingButton();
            this.setupClearStatsButton();
        });
    }

    // Initialize timers and load previous data
    initializeTimers() {
        chrome.storage.local.get(['previousMeetingData'], (result) => {
            this.previousMeetingData = result.previousMeetingData ?
                JSON.parse(result.previousMeetingData) : {};

            this.sortTeamMembers();
            this.initializeTimerData();
            this.renderTeamMembers();
        });
    }

    // Initialize timer data for all members
    initializeTimerData() {
        this.teamMembers.forEach(member => {
            this.timers[member.name] = {
                totalSeconds: 0,
                intervalId: null,
                isRunning: false
            };
        });
    }

    // Sort team members by previous meeting time or alphabetically
    sortTeamMembers() {
        this.teamMembers.sort((a, b) => {
            const timeA = this.previousMeetingData[a.name] || 0;
            const timeB = this.previousMeetingData[b.name] || 0;

            if (timeA === 0 && timeB === 0) {
                return a.name.localeCompare(b.name);
            }

            return timeB - timeA;
        });
    }

    // Sort team members alphabetically
    sortTeamMembersAlphabetically() {
        this.teamMembers.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Format seconds into MM:SS format
    formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    // Create safe ID from member name
    createSafeId(memberName) {
        return memberName.replace(/\s+/g, '-');
    }

    // Render team members list
    renderTeamMembers() {
        const container = document.getElementById('team-members-container');
        if (!container) return;

        container.innerHTML = '';

        this.teamMembers.forEach(member => {
            const memberDiv = this.createMemberElement(member);
            container.appendChild(memberDiv);
        });
    }

    // Create element for a team member
    createMemberElement(member) {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'team-member';

        // Add avatar
        memberDiv.appendChild(this.createAvatarElement(member));

        // Add member info
        memberDiv.appendChild(this.createMemberInfoElement(member));

        // Add control button
        memberDiv.appendChild(this.createControlButtonElement(member));

        return memberDiv;
    }

    // Create avatar element
    createAvatarElement(member) {
        const avatar = document.createElement('img');
        avatar.className = 'avatar';
        avatar.src = member.avatarUrl;
        avatar.alt = member.name;
        avatar.onerror = function () {
            this.src = 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
                  <circle cx="15" cy="15" r="15" fill="#ccc"/>
                  <text x="15" y="20" font-family="Arial" font-size="14" text-anchor="middle" fill="#666">
                    ${member.name.charAt(0)}
                  </text>
                </svg>
            `);
        };
        return avatar;
    }

    // Create member info element
    createMemberInfoElement(member) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'member-info';

        // Add name
        const nameSpan = document.createElement('span');
        nameSpan.className = 'member-name';
        nameSpan.textContent = member.name;
        infoDiv.appendChild(nameSpan);

        // Add time info
        infoDiv.appendChild(this.createTimeInfoElement(member));

        return infoDiv;
    }

    // Create time info element
    createTimeInfoElement(member) {
        const timeInfoDiv = document.createElement('div');
        timeInfoDiv.className = 'time-info';

        // Current meeting time
        const timeSpan = document.createElement('span');
        timeSpan.className = 'member-time';
        timeSpan.id = `time-${this.createSafeId(member.name)}`;
        timeSpan.textContent = '00:00';
        timeInfoDiv.appendChild(timeSpan);

        // Previous meeting time
        const previousTimeSpan = document.createElement('span');
        previousTimeSpan.className = 'previous-time';

        if (this.previousMeetingData[member.name]) {
            previousTimeSpan.textContent = `Previous: ${this.formatTime(this.previousMeetingData[member.name])}`;
        } else {
            previousTimeSpan.textContent = 'No previous data';
            previousTimeSpan.classList.add('no-data');
        }

        timeInfoDiv.appendChild(previousTimeSpan);
        return timeInfoDiv;
    }

    // Create control button element
    createControlButtonElement(member) {
        const button = document.createElement('button');
        button.className = 'control-button';
        button.id = `button-${this.createSafeId(member.name)}`;
        button.textContent = 'Start';

        button.addEventListener('click', () => this.toggleTimer(member.name));

        return button;
    }

    // Toggle timer for a team member
    toggleTimer(memberName) {
        if (this.timers[memberName].isRunning) {
            this.pauseTimer(memberName);
            return;
        }

        // If another timer is running, pause it first
        if (this.activeTimerId !== null) {
            this.pauseTimer(this.activeTimerId);
        }

        this.startTimer(memberName);
    }

    // Start timer for a team member
    startTimer(memberName) {
        this.activeTimerId = memberName;
        this.timers[memberName].isRunning = true;

        const button = document.getElementById(`button-${this.createSafeId(memberName)}`);
        if (button) {
            button.textContent = 'Pause';
            button.classList.add('active');
        }

        this.timers[memberName].intervalId = setInterval(() => {
            this.timers[memberName].totalSeconds += 1;
            this.updateTimeDisplay(memberName);
        }, 1000);
    }

    // Pause timer for a team member
    pauseTimer(memberName) {
        if (!this.timers[memberName] || !this.timers[memberName].isRunning) return;

        clearInterval(this.timers[memberName].intervalId);
        this.timers[memberName].isRunning = false;

        const button = document.getElementById(`button-${this.createSafeId(memberName)}`);
        if (button) {
            button.textContent = 'Resume';
            button.classList.remove('active');
        }

        if (this.activeTimerId === memberName) {
            this.activeTimerId = null;
        }
    }

    // Update time display for a team member
    updateTimeDisplay(memberName) {
        const timeSpan = document.getElementById(`time-${this.createSafeId(memberName)}`);
        if (timeSpan) {
            const totalSeconds = this.timers[memberName].totalSeconds;
            timeSpan.textContent = this.formatTime(totalSeconds);
        }
    }

    // Set up End Meeting button
    setupEndMeetingButton() {
        const endButton = document.getElementById('endMeeting');
        if (!endButton) return;

        endButton.addEventListener('click', () => this.endMeeting());
    }

    // End the meeting and save data
    endMeeting() {
        // Pause any active timer
        if (this.activeTimerId !== null) {
            this.pauseTimer(this.activeTimerId);
        }

        // Create updated record of all times
        const updatedMeetingData = { ...this.previousMeetingData };

        Object.keys(this.timers).forEach(memberName => {
            const speakingTime = this.timers[memberName].totalSeconds;
            if (speakingTime > 0) {
                updatedMeetingData[memberName] = speakingTime;
            }
        });

        // Save to storage
        chrome.storage.local.set({
            previousMeetingData: JSON.stringify(updatedMeetingData)
        }, () => {
            this.previousMeetingData = updatedMeetingData;
            this.sortTeamMembers();
            this.resetAllTimers();
            this.renderTeamMembers();

            alert('Meeting ended! Team members have been sorted by speaking time for the next meeting.');
        });
    }

    // Reset all timers
    resetAllTimers() {
        Object.keys(this.timers).forEach(memberName => {
            this.timers[memberName].totalSeconds = 0;
        });
    }

    // Set up Clear Statistics button
    setupClearStatsButton() {
        const clearButton = document.getElementById('clearStats');
        if (!clearButton) return;

        clearButton.addEventListener('click', () => this.clearStats());
    }

    // Clear all statistics
    clearStats() {
        if (confirm('Are you sure you want to clear all meeting statistics?')) {
            chrome.storage.local.remove(['previousMeetingData'], () => {
                this.previousMeetingData = {};
                this.sortTeamMembersAlphabetically();
                this.resetAllTimers();
                this.renderTeamMembers();
            });
        }
    }
}

// Initialize the timer when the script loads
const standupTimer = new StandupTimer();