const config = [
  { name: "Stanko", avatarUrl: "https://i.pravatar.cc/32?u=alice" },
  { name: "Kosta", avatarUrl: "https://i.pravatar.cc/32?u=bob" },
  { name: "Roma", avatarUrl: "https://i.pravatar.cc/32?u=charlie" },
  { name: "M2", avatarUrl: "https://i.pravatar.cc/32?u=charlie" },
  { name: "Marek", avatarUrl: "https://i.pravatar.cc/32?u=charlie" },
  { name: "Igor", avatarUrl: "https://i.pravatar.cc/32?u=charlie" },
  { name: "Jan", avatarUrl: "https://i.pravatar.cc/32?u=charlie" },
  { name: "Vaclav", avatarUrl: "https://i.pravatar.cc/32?u=charlie" },
  { name: "Dima", avatarUrl: "https://i.pravatar.cc/32?u=charlie" },
];

let active = null;
let intervals = {};
let times = JSON.parse(localStorage.getItem("meetingTimes") || "{}");

function renderParticipants() {
  const container = document.getElementById("participants");
  container.innerHTML = "";

  config.sort((a, b) => (times[b.name] || 0) - (times[a.name] || 0));

  for (const member of config) {
    const el = document.createElement("div");
    el.className = "participant";
    // el.innerHTML = `
    //   <img src="${member.avatarUrl}" />

    el.innerHTML = `
      <span>${member.name}</span>
      <button id="btn-${member.name}">Start</button>
      <span class="timer" id="timer-${member.name}">0s</span>
    `;
    container.appendChild(el);

    document.getElementById(`btn-${member.name}`).onclick = () => startTimer(member.name);
    updateTimerDisplay(member.name);
  }
}

function startTimer(name) {
  if (active && active !== name) {
    clearInterval(intervals[active]);
  }
  active = name;
  if (!times[name]) times[name] = 0;
  const start = Date.now();
  intervals[name] = setInterval(() => {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    updateTimerDisplay(name, elapsed);
  }, 1000);
}

function updateTimerDisplay(name, plus = 0) {
  const total = (times[name] || 0) + plus;
  document.getElementById(`timer-${name}`).textContent = `${total}s`;
}

function stopAllTimers() {
  if (active) {
    const elapsed = Math.floor((Date.now() - intervals[active].start) / 1000);
    times[active] = (times[active] || 0) + elapsed;
    clearInterval(intervals[active]);
  }
  localStorage.setItem("meetingTimes", JSON.stringify(times));
}

function endMeeting() {
  stopAllTimers();
  renderParticipants();
}

document.getElementById("endMeeting").onclick = endMeeting;

renderParticipants();
