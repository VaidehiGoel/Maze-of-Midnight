document.getElementById("capsuleForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const message = document.getElementById("message").value.trim();
  const unlockTime = document.getElementById("unlockTime").value;

  if (!title || !message || !unlockTime) return;

  const capsule = {
    id: Date.now().toString(),
    title,
    message,
    unlockTime,
    opened: false,
    revealed: false
  };

  const capsules = getCapsules();
  capsules.push(capsule);
  localStorage.setItem("capsules", JSON.stringify(capsules));

  this.reset();
  renderAll();
});

function getCapsules() {
  return JSON.parse(localStorage.getItem("capsules")) || [];
}

function renderAll() {
  renderUnopened();
}

function renderUnopened() {
  const container = document.getElementById("capsuleList-unopened");
  container.innerHTML = "";
  const now = new Date();
  const capsules = getCapsules().filter(c => !c.opened && new Date(c.unlockTime) <= now);

  capsules.forEach(c => {
    const div = document.createElement("div");
    div.className = "capsuleCard";

    const isRevealed = c.revealed;

    div.innerHTML = `
      <h3>${c.title}</h3>
      <p><strong>Unlocked:</strong> ${new Date(c.unlockTime).toLocaleString()}</p>
      <div id="message-${c.id}" class="${isRevealed ? '' : 'message-hidden'}">
        <p>${c.message}</p>
        <button class="openBtn" onclick="markAsRead('${c.id}')">Mark as Read</button>
      </div>
      <div id="reveal-${c.id}" class="${isRevealed ? 'message-hidden' : ''}">
        <button class="openBtn" onclick="revealMessage('${c.id}')">Open Capsule</button>
      </div>
    `;

    container.appendChild(div);
  });
}

function revealMessage(id) {
  const capsules = getCapsules();
  const idx = capsules.findIndex(c => c.id === id);
  if (idx !== -1) {
    capsules[idx].revealed = true;
    localStorage.setItem("capsules", JSON.stringify(capsules));
    renderAll();
  }
}

function markAsRead(id) {
  const capsules = getCapsules();
  const idx = capsules.findIndex(c => c.id === id);
  if (idx !== -1) {
    capsules[idx].opened = true;
    capsules[idx].revealed = false;
    localStorage.setItem("capsules", JSON.stringify(capsules));
    renderAll();
  }
}

function renderOther(type) {
  const container = document.getElementById("capsuleList-other");
  const content = document.getElementById("capsuleList-content");
  const title = document.getElementById("otherSectionTitle");
  container.style.display = "block";
  document.getElementById("homeSection").style.display = "none";
  document.getElementById("unopenedSection").style.display = "none";

  const now = new Date();
  let capsules = getCapsules();
  content.innerHTML = "";

  if (type === "opened") {
    title.textContent = "📖 Opened Capsules";
    capsules = capsules.filter(c => c.opened);
  } else if (type === "future") {
    title.textContent = "🕒 Future Capsules";
    capsules = capsules.filter(c => !c.opened && new Date(c.unlockTime) > now);
  }

  capsules.forEach(c => {
    const div = document.createElement("div");
    div.className = "capsuleCard";

    let html = `
      <h3>${c.title}</h3>
      <p><strong>Unlocks:</strong> ${new Date(c.unlockTime).toLocaleString()}</p>
    `;

    if (type === "future") {
      const countdown = getCountdownString(c.unlockTime);
      html += `<p class="countdown">⏳ ${countdown}</p>`;
    } else {
      html += `<p>${c.message}</p>`;
    }

    div.innerHTML = html;
    content.appendChild(div);
  });

  if (type === "future") {
    startCountdowns();
  }
}

function getCountdownString(unlockTime) {
  const now = new Date();
  const then = new Date(unlockTime);
  const diff = then - now;

  if (diff <= 0) return "Available Now!";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours}h ${minutes}m ${seconds}s left`;
}

function startCountdowns() {
  const updateCountdowns = () => {
    const capsules = getCapsules().filter(c => !c.opened && new Date(c.unlockTime) > new Date());
    const content = document.getElementById("capsuleList-content");
    const countdownEls = content.querySelectorAll(".countdown");

    countdownEls.forEach((el, index) => {
      const c = capsules[index];
      if (c) {
        el.textContent = `⏳ ${getCountdownString(c.unlockTime)}`;
      }
    });
  };

  updateCountdowns();
  setInterval(updateCountdowns, 1000);
}

function showSection(section) {
  document.getElementById("capsuleList-other").style.display = "block";
  document.getElementById("homeSection").style.display = "none";
  document.getElementById("unopenedSection").style.display = "none";
  renderOther(section);
}

function scrollToSection(sectionId) {
  const home = document.getElementById("homeSection");
  const unopened = document.getElementById("unopenedSection");
  const other = document.getElementById("capsuleList-other");

  home.style.display = "block";
  unopened.style.display = "block";
  other.style.display = "none";

  document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
  renderAll();
}

renderAll();
