document.addEventListener("DOMContentLoaded", () => {
  let db;
  let recordedAudioBase64 = null;

  const request = indexedDB.open("CapsuleDB", 1);
  request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("capsules")) {
      db.createObjectStore("capsules", { keyPath: "id" });
    }
  };
  request.onsuccess = (e) => {
    db = e.target.result;
    renderUnopenedCapsules();
  };
  request.onerror = () => alert("❌ Failed to open CapsuleDB");

  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const reader = new FileReader();
      reader.onloadend = () => {
        recordedAudioBase64 = reader.result;
        const audio = document.getElementById("recordedAudio");
        audio.src = recordedAudioBase64;
        audio.style.display = "block";
      };
      reader.readAsDataURL(blob);
    };

    document.getElementById("startRecording").onclick = () => {
      recorder.start();
      document.getElementById("startRecording").disabled = true;
      document.getElementById("stopRecording").disabled = false;
    };
    document.getElementById("stopRecording").onclick = () => {
      recorder.stop();
      document.getElementById("startRecording").disabled = false;
      document.getElementById("stopRecording").disabled = true;
    };
  });

  document.getElementById("capsuleForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    const message = document.getElementById("message").value.trim();
    const unlockTime = document.getElementById("unlockTime").value;
    const photoFile = document.getElementById("photo").files[0];
    const videoFile = document.getElementById("video").files[0];

    const readFile = file => new Promise(resolve => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

    const photo = await readFile(photoFile);
    const video = await readFile(videoFile);

    const capsule = {
      id: Date.now().toString(),
      title,
      message,
      unlockTime,
      photo,
      video,
      voiceNote: recordedAudioBase64,
      opened: false,
      revealed: false
    };

    const tx = db.transaction("capsules", "readwrite");
    tx.objectStore("capsules").add(capsule);
    tx.oncomplete = () => {
      alert("✅ Capsule created!");
      document.getElementById("capsuleForm").reset();
      document.getElementById("recordedAudio").style.display = "none";
      recordedAudioBase64 = null;
      setTimeout(() => renderUnopenedCapsules(), 100);
    };
    tx.onerror = () => console.error("❌ Failed to store capsule");
  });

  // 🧭 Navigation
  document.getElementById("btn-home").onclick = () => showOnly("homeSection");
  document.getElementById("btn-unopened").onclick = () => {
    showOnly("unopenedSection");
    renderUnopenedCapsules();
  };
  document.getElementById("btn-opened").onclick = () => {
    showOnly("capsuleList-other");
    document.getElementById("otherSectionTitle").textContent = "📖 Opened Capsules";
    renderOpenedCapsules();
  };
  document.getElementById("btn-future").onclick = () => {
    showOnly("capsuleList-other");
    document.getElementById("otherSectionTitle").textContent = "🕒 Future Capsules";
    renderFutureCapsules();
  };

  function showOnly(id) {
    ["homeSection", "unopenedSection", "capsuleList-other"].forEach(sectionId => {
      document.getElementById(sectionId).style.display = (sectionId === id) ? "block" : "none";
    });
  }

  // 🔓 Unopened Capsules
  function renderUnopenedCapsules() {
    const container = document.getElementById("capsuleList-unopened");
    container.innerHTML = "";
    const now = new Date();

    const tx = db.transaction("capsules", "readonly");
    const store = tx.objectStore("capsules");
    const request = store.openCursor();

    request.onsuccess = function (e) {
      const cursor = e.target.result;
      if (cursor) {
        const c = cursor.value;
        if (!c.opened && new Date(c.unlockTime) <= now) {
          const div = createCapsuleCard(c, true);
          container.appendChild(div);
        }
        cursor.continue();
      }
    };
  }

  // 📖 Opened Capsules — no media
  function renderOpenedCapsules() {
  const container = document.getElementById("capsuleList-content");
  container.innerHTML = "";

  const tx = db.transaction("capsules", "readonly");
  const store = tx.objectStore("capsules");
  const request = store.openCursor();

  request.onsuccess = function (e) {
    const cursor = e.target.result;
    if (cursor) {
      const c = cursor.value;
      if (c.opened) {
        const div = document.createElement("div");
        div.className = "capsuleCard";
        div.innerHTML = `
          <h3>${c.title}</h3>
          <p><strong>Unlocked:</strong> ${new Date(c.unlockTime).toLocaleString()}</p>
          <p>${c.message}</p>
          ${c.voiceNote ? `
            <audio controls>
              <source src="${c.voiceNote}" type="audio/webm">
              Your browser does not support the audio tag.
            </audio>` : ""
          }
          ${c.photo ? `<img src="${c.photo}" class="capsule-img" />` : ""}
          ${c.video ? `<video controls src="${c.video}"></video>` : ""}
        `;
        container.appendChild(div);
      }
      cursor.continue();
    }
  };
}

  // ⏳ Future Capsules — no button
  function renderFutureCapsules() {
    const container = document.getElementById("capsuleList-content");
    container.innerHTML = "";

    const now = new Date();
    const tx = db.transaction("capsules", "readonly");
    const store = tx.objectStore("capsules");
    const request = store.openCursor();

    request.onsuccess = function (e) {
      const cursor = e.target.result;
      if (cursor) {
        const c = cursor.value;
        if (!c.opened && new Date(c.unlockTime) > now) {
          const div = document.createElement("div");
          div.className = "capsuleCard";
          div.innerHTML = `
            <h3>${c.title}</h3>
            <p><strong>Unlocks:</strong> ${new Date(c.unlockTime).toLocaleString()}</p>
            <p class="countdown" data-unlock="${c.unlockTime}">⏳ ${getCountdown(c.unlockTime)}</p>
          `;
          container.appendChild(div);
        }
        cursor.continue();
      }
    };

    startCountdowns();
  }

  // ⏱ Countdown Updater
  function startCountdowns() {
    setInterval(() => {
      document.querySelectorAll(".countdown").forEach(el => {
        const unlockText = el.getAttribute("data-unlock");
        el.textContent = "⏳ " + getCountdown(unlockText);
      });
    }, 1000);
  }

  function getCountdown(timeStr) {
    const now = new Date();
    const then = new Date(timeStr);
    const diff = then - now;
    if (diff <= 0) return "Available Now!";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h}h ${m}m ${s}s remaining`;
  }

  // 📦 Card builder
  function createCapsuleCard(c, allowReveal) {
  const div = document.createElement("div");
  div.className = "capsuleCard";

  let content = `
    <h3>${c.title}</h3>
    <p><strong>Unlocked:</strong> ${new Date(c.unlockTime).toLocaleString()}</p>
  `;

  if (!c.revealed && allowReveal) {
    content += `<button onclick="revealCapsule('${c.id}')">Open Capsule</button>`;
  } else if (c.revealed) {
    content += `<p>${c.message}</p>`;

    // 🎙️ Show media only in revealed (not opened) capsules
    if (allowReveal) {
      if (c.voiceNote) {
        content += `
          <audio controls>
            <source src="${c.voiceNote}" type="audio/webm">
            Your browser does not support the audio tag.
          </audio>
        `;
      }
      if (c.photo) {
        content += `<img src="${c.photo}" class="capsule-img" />`;
      }
      if (c.video) {
        content += `<video controls src="${c.video}"></video>`;
      }
      content += `<button onclick="markCapsuleAsRead('${c.id}')">Mark as Read</button>`;
    }
  }

  div.innerHTML = content;
  return div;
}

  // 🎬 Reveal capsule
    window.revealCapsule = id => {
    const tx = db.transaction("capsules", "readwrite");
    const store = tx.objectStore("capsules");
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const capsule = getReq.result;
      capsule.revealed = true;
      store.put(capsule);
      setTimeout(() => renderUnopenedCapsules(), 100);
    };
  };
    window.markCapsuleAsRead = id => {
    const tx = db.transaction("capsules", "readwrite");
    const store = tx.objectStore("capsules");
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const capsule = getReq.result;
      capsule.opened = true;
      capsule.revealed = false;
      store.put(capsule);
      setTimeout(() => renderUnopenedCapsules(), 100);
    };
  };
});