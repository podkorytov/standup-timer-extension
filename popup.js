// popup.js
document.addEventListener('DOMContentLoaded', function () {
  // Load saved team members if available
  chrome.storage.local.get(['teamMembers'], function (result) {
    const teamMembersInput = document.getElementById('teamMembers');
    if (result.teamMembers) {
      teamMembersInput.value = JSON.stringify(JSON.parse(result.teamMembers), null, 2);
    }
  });

  document.getElementById('startButton').addEventListener('click', function () {
    const teamMembersInput = document.getElementById('teamMembers');
    let teamMembers;

    try {
      teamMembers = JSON.parse(teamMembersInput.value);
      if (!Array.isArray(teamMembers)) {
        throw new Error('Team members must be an array');
      }

      // Validate each team member has required properties
      for (const member of teamMembers) {
        if (typeof member.name !== 'string' || typeof member.avatarUrl !== 'string') {
          throw new Error('Each team member must have name and avatarUrl properties');
        }
      }

      // Save team members to storage
      chrome.storage.local.set({ teamMembers: JSON.stringify(teamMembers) });

      // Send message to content script to create the timer UI
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "createTimer", teamMembers: teamMembers });
      });

      // Close the popup
      window.close();
    } catch (e) {
      alert('Invalid team members format: ' + e.message);
    }
  });
});