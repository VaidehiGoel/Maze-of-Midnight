window.onload = () => {
  // Voice recording setup
  let mediaRecorder;
  let audioChunks = [];
  let recordedAudioBase64 = null;

  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        recordedAudioBase64 = reader.result;
        document.getElementById("recordedAudio").src = recordedAudioBase64;
        document.getElementById("recordedAudio").style.display = "block";
      };
      reader.readAsDataURL(blob);
      audioChunks = [];
    };
  });

  document.getElementById("startRecording").onclick = () => {
    mediaRecorder.start();
    document.getElementById("startRecording").disabled = true;
    document.getElementById("stopRecording").disabled = false;
  };

  document.getElementById("stopRecording").onclick = () => {
    mediaRecorder.stop();
    document.getElementById("startRecording").disabled = false;
    document.getElementById("stopRecording").disabled = true;
  };

  // Navbar buttons
  document.getElementById("btn-home").onclick = () => showOnly("homeSection");
  document.getElementById("btn-unopened").onclick = () => showOnly("unopenedSection");
  document.getElementById("btn-opened").onclick = () => showOther("opened");
  document.getElementById("btn-future").onclick = () => showOther("future");

  function showOnly(id) {
    const sections = ["homeSection", "unopenedSection", "capsuleList-other"];
    sections.forEach(s => {
      document.getElementById(s).style.display = (s === id) ? "block" : "none";
    });
    if (id === "unopenedSection") renderUnopened();
  }

  function showOther(type) {
    document.getElementById("homeSection").style.display = "none";
    document.getElementById("unopenedSection").style.display = "none";
    document.getElementById("capsuleList-other").style.display = "block";
    renderOther(type);
  }

  document.getElementById("capsuleForm").onsubmit = function(e) {
    e.preventDefault();
    const title = document.getElementById("title").value.trim();
    const message = document.getElementById("message").value.trim();
    const unlockTime = document.getElementById("unlockTime").value;
    const photoFile = document.getElementById("photo").files[0];
    const videoFile = document.getElementById("video").files[0];

    const readers = [];
    let photoBase64 = null, videoBase64 = null;

    if (photoFile) {
      readers.push(new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => {
          photoBase64 = reader.result;
          resolve();
        };
        reader.readAsDataURL(photoFile);
      }));
    }

    if (videoFile) {
      readers.push(new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => {
          videoBase64 = reader.result;
          resolve();
        };
        reader.readAsDataURL(videoFile);
      }));
    }

    Promise.all(readers).then(() => {
      const capsule = {
        id: Date.now().toString(),
        title,
        message,
        unlockTime,
        opened: false,
        revealed: false,
        photo: photoBase64,
        video: videoBase64,
        voiceNote: recordedAudioBase64
      };
      const capsules = getCapsules();
      capsules.push(capsule);
      localStorage.setItem("capsules", JSON.stringify(capsules));
      this.reset();
      document.getElementById("recordedAudio").style.display = "none";
      recordedAudioBase64 = null;
      showOnly("unopenedSection");
    });
  };

  function getCapsules() {
    return JSON.parse(localStorage.getItem("capsules")) || [];
  }

  function renderUnopened() {
  const container = document.getElementById("capsuleList-unopened");
  container.innerHTML = "";
  const now = new Date();
  const capsules = getCapsules().filter(c => !c.opened && new Date(c.unlockTime) <= now);

  capsules.forEach(c => {
    const div = document.createElement("div");
    div.className = "capsuleCard";

    let html = `
      <h3>${c.title}</h3>
      <p><strong>Unlocked:</strong> ${new Date(c.unlockTime).toLocaleString()}</p>
    `;

    // ✅ Neatly grouped media block
    if (c.revealed && (c.voiceNote || c.photo || c.video)) {
      html += `<div class="media-block">`;

      if (c.voiceNote) {
        html += `<audio controls src="${c.voiceNote}"></audio>`;
      }
      if (c.photo) {
        html += `<img src="${c.photo}" class="capsule-img" />`;
      }
      if (c.video) {
        html += `<video controls src="${c.video}"></video>`;
      }

      html += `</div>`;
    }

    html += `
      <div class="${c.revealed ? '' : 'message-hidden'}">
        <p>${c.message}</p>
        <button onclick="markAsRead('${c.id}')">Mark as Read</button>
      </div>
      <div class="${c.revealed ? 'message-hidden' : ''}">
        <button onclick="revealMessage('${c.id}')">Open Capsule</button>
      </div>
    `;

    div.innerHTML = html;
    container.appendChild(div);
  });
}

  window.revealMessage = function(id) {
    const capsules = getCapsules();
    const index = capsules.findIndex(c => c.id === id);
    if (index !== -1) {
      capsules[index].revealed = true;
      localStorage.setItem("capsules", JSON.stringify(capsules));
      renderUnopened();
    }
  };

  window.markAsRead = function(id) {
    const capsules = getCapsules();
    const index = capsules.findIndex(c => c.id === id);
    if (index !== -1) {
      capsules[index].opened = true;
      capsules[index].revealed = false;
      localStorage.setItem("capsules", JSON.stringify(capsules));
      renderUnopened();
    }
  };

  function renderOther(type) {
  const container = document.getElementById("capsuleList-content");
  container.innerHTML = "";
  document.getElementById("otherSectionTitle").textContent =
    type === "opened" ? "📖 Opened Capsules" : "🕒 Future Capsules";

  const now = new Date();
  let capsules = getCapsules();

  capsules = (type === "opened")
    ? capsules.filter(c => c.opened)
    : capsules.filter(c => !c.opened && new Date(c.unlockTime) > now);

  capsules.forEach(c => {
    const div = document.createElement("div");
    div.className = "capsuleCard";

    let html = `
      <h3>${c.title}</h3>
      <p><strong>Unlocks:</strong> ${new Date(c.unlockTime).toLocaleString()}</p>
    `;

    if (type === "future") {
      html += `<p class="countdown">⏳ ${getCountdownString(c.unlockTime)}</p>`;
    } else {
      // ✅ Neatly grouped media block
      if (c.voiceNote || c.photo || c.video) {
        html += `<div class="media-block">`;

        if (c.voiceNote) {
          html += `<audio controls src="${c.voiceNote}"></audio>`;
        }
        if (c.photo) {
          html += `<img src="${c.photo}" class="capsule-img" />`;
        }
        if (c.video) {
          html += `<video controls src="${c.video}"></video>`;
        }

        html += `</div>`;
      }

      html += `<p>${c.message}</p>`;
    }

    div.innerHTML = html;
    container.appendChild(div);
  });

  if (type === "future") startCountdowns();
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

  // Initial load
  showOnly("homeSection");
};