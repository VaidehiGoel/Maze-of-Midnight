function lockCapsule() {
  const message = document.getElementById("message").value.trim();
  const unlockTime = document.getElementById("unlockTime").value;

  if (!message || !unlockTime) {
    alert("Please enter a message and choose unlock time!");
    return;
  }

  const unlockDate = new Date(unlockTime);
  const now = new Date();

  if (unlockDate <= now) {
    alert("Unlock time must be in the future.");
    return;
  }

  localStorage.setItem("capsuleMessage", message);
  localStorage.setItem("capsuleUnlockTime", unlockDate.toISOString());

  updateUI();
}

function updateUI() {
  const message = localStorage.getItem("capsuleMessage");
  const unlockTime = localStorage.getItem("capsuleUnlockTime");

  if (!message || !unlockTime) return;

  const unlockDate = new Date(unlockTime);
  const now = new Date();

  document.getElementById("capsuleForm").classList.add("hidden");

  if (now >= unlockDate) {
    document.getElementById("lockedCapsule").classList.remove("hidden");
    document.getElementById("unlockedCapsule").classList.add("hidden");
    document.getElementById("unlockDisplay").textContent = unlockDate.toLocaleString();
    document.getElementById("countdown").textContent = "Ready to open!";
    document.getElementById("openButton").classList.remove("hidden");
  } else {
    document.getElementById("lockedCapsule").classList.remove("hidden");
    document.getElementById("unlockedCapsule").classList.add("hidden");
    document.getElementById("unlockDisplay").textContent = unlockDate.toLocaleString();
    updateCountdown(unlockDate);
  }
}

function updateCountdown(unlockDate) {
  const countdownEl = document.getElementById("countdown");
  const openButton = document.getElementById("openButton");

  const interval = setInterval(() => {
    const now = new Date();
    const diff = unlockDate - now;

    if (diff <= 0) {
      clearInterval(interval);
      countdownEl.textContent = "Ready to open!";
      openButton.classList.remove("hidden");
    } else {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      countdownEl.textContent = `${hours}h ${mins}m ${secs}s`;
    }
  }, 1000);
}

function openCapsule() {
  const unlockTime = localStorage.getItem("capsuleUnlockTime");
  const now = new Date();
  const unlockDate = new Date(unlockTime);

  if (now < unlockDate) {
    alert("It's not time yet!");
    return;
  }

  const message = localStorage.getItem("capsuleMessage");
  document.getElementById("lockedCapsule").classList.add("hidden");
  document.getElementById("unlockedCapsule").classList.remove("hidden");
  document.getElementById("revealedMessage").textContent = message;
}

function resetCapsule() {
  localStorage.removeItem("capsuleMessage");
  localStorage.removeItem("capsuleUnlockTime");
  location.reload();
}

// On load
updateUI();
