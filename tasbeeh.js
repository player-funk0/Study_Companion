const TASBEEH_STORAGE = "study_helper_tasbeeh_v1";

const elements = {
  tasbeehPreset: document.getElementById("tasbeehPreset"),
  customDhikrWrap: document.getElementById("customDhikrWrap"),
  customDhikrInput: document.getElementById("customDhikrInput"),
  tasbeehTarget: document.getElementById("tasbeehTarget"),
  tasbeehCurrentDhikr: document.getElementById("tasbeehCurrentDhikr"),
  tasbeehCount: document.getElementById("tasbeehCount"),
  tasbeehProgressBar: document.getElementById("tasbeehProgressBar"),
  tasbeehProgressText: document.getElementById("tasbeehProgressText"),
  incrementBtn: document.getElementById("incrementBtn"),
  incrementTenBtn: document.getElementById("incrementTenBtn"),
  decrementBtn: document.getElementById("decrementBtn"),
  resetTasbeehBtn: document.getElementById("resetTasbeehBtn"),
  tasbeehMessage: document.getElementById("tasbeehMessage"),
  tasbeehTotalToday: document.getElementById("tasbeehTotalToday"),
  tasbeehSessionsList: document.getElementById("tasbeehSessionsList"),
  tasbeehSessionsEmpty: document.getElementById("tasbeehSessionsEmpty"),
};

const state = loadState();

init();

function init() {
  applyStateToInputs();
  setupListeners();
  render();
}

function setupListeners() {
  elements.tasbeehPreset.addEventListener("change", handlePresetChange);
  elements.customDhikrInput.addEventListener("input", handleCustomDhikrInput);
  elements.tasbeehTarget.addEventListener("change", handleTargetChange);
  elements.incrementBtn.addEventListener("click", () => incrementCount(1));
  elements.incrementTenBtn.addEventListener("click", () => incrementCount(10));
  elements.decrementBtn.addEventListener("click", () => incrementCount(-1));
  elements.resetTasbeehBtn.addEventListener("click", resetCurrentCount);
  document.addEventListener("keydown", handleKeyboardShortcut);
}

function handlePresetChange() {
  state.preset = elements.tasbeehPreset.value;

  if (state.preset !== "custom") {
    state.currentDhikr = state.preset;
  } else if (!state.currentDhikr) {
    state.currentDhikr = "سبحان الله";
  }

  persist();
  render();
}

function handleCustomDhikrInput() {
  if (state.preset !== "custom") {
    return;
  }

  const value = elements.customDhikrInput.value.trim();
  state.currentDhikr = value || "ذكر مخصص";
  persist();
  render();
}

function handleTargetChange() {
  const target = normalizeTarget(Number(elements.tasbeehTarget.value));
  state.target = target;
  persist();
  render();
}

function incrementCount(delta) {
  const before = state.count;
  state.count = Math.max(0, state.count + delta);

  if (before < state.target && state.count >= state.target) {
    saveSession();
    showMessage("أحسنت، تم بلوغ الهدف وحفظ الجلسة.", "info");
  } else {
    hideMessage();
  }

  persist();
  render();
}

function resetCurrentCount() {
  state.count = 0;
  hideMessage();
  persist();
  render();
}

function saveSession() {
  const now = new Date();
  const entry = {
    id: getId(),
    dhikr: getDhikrText(),
    count: state.count,
    createdAt: now.toISOString(),
    localDateKey: getLocalDateKey(now),
  };

  state.sessions.unshift(entry);
  state.sessions = state.sessions.slice(0, 40);
  state.count = 0;
}

function handleKeyboardShortcut(event) {
  if (event.code !== "Space") {
    return;
  }

  const targetTag = event.target && event.target.tagName;
  if (targetTag === "INPUT" || targetTag === "TEXTAREA" || targetTag === "SELECT") {
    return;
  }

  event.preventDefault();
  incrementCount(1);
}

function getDhikrText() {
  if (state.preset === "custom") {
    return state.currentDhikr || "ذكر مخصص";
  }
  return state.preset;
}

function render() {
  const dhikrText = getDhikrText();
  const progress = Math.min(100, Math.round((state.count / state.target) * 100));

  elements.tasbeehCurrentDhikr.textContent = dhikrText;
  elements.tasbeehCount.textContent = String(state.count);
  elements.tasbeehProgressText.textContent = `${progress}%`;
  elements.tasbeehProgressBar.style.width = `${progress}%`;

  const isCustom = state.preset === "custom";
  elements.customDhikrWrap.classList.toggle("hidden", !isCustom);
  elements.customDhikrInput.value = isCustom ? state.currentDhikr : "";
  elements.tasbeehTarget.value = String(state.target);

  renderSessions();
}

function renderSessions() {
  const todayKey = getLocalDateKey(new Date());
  const todaySessions = state.sessions.filter((item) => {
    if (typeof item.localDateKey === "string") {
      return item.localDateKey === todayKey;
    }
    return getLocalDateKey(new Date(item.createdAt)) === todayKey;
  });
  const totalToday = todaySessions.reduce((sum, item) => sum + item.count, 0);

  if (todaySessions.length === 0) {
    elements.tasbeehSessionsList.innerHTML = "";
    elements.tasbeehSessionsEmpty.classList.remove("hidden");
    elements.tasbeehTotalToday.classList.add("hidden");
    elements.tasbeehTotalToday.textContent = "";
    return;
  }

  elements.tasbeehSessionsEmpty.classList.add("hidden");
  elements.tasbeehTotalToday.classList.remove("hidden");
  elements.tasbeehTotalToday.textContent = `إجمالي تسبيح اليوم: ${totalToday}`;

  elements.tasbeehSessionsList.innerHTML = "";
  for (const session of todaySessions) {
    const timeLabel = new Date(session.createdAt).toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const li = document.createElement("li");
    li.className = "tasbeeh-session-item";
    li.innerHTML = `
      <strong>${escapeHtml(session.dhikr)}</strong>
      <span>${session.count} | ${timeLabel}</span>
    `;
    elements.tasbeehSessionsList.appendChild(li);
  }
}

function applyStateToInputs() {
  elements.tasbeehPreset.value = state.preset;
  elements.customDhikrInput.value = state.currentDhikr;
  elements.tasbeehTarget.value = String(state.target);
}

function normalizeTarget(value) {
  if (!Number.isFinite(value) || value < 1) {
    return 100;
  }
  return Math.min(100000, Math.round(value));
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function showMessage(text, type) {
  elements.tasbeehMessage.textContent = text;
  elements.tasbeehMessage.className = `msg ${type}`;
}

function hideMessage() {
  elements.tasbeehMessage.textContent = "";
  elements.tasbeehMessage.className = "msg hidden";
}

function loadState() {
  const fallback = {
    preset: "سبحان الله",
    currentDhikr: "سبحان الله",
    target: 100,
    count: 0,
    sessions: [],
  };

  try {
    const raw = localStorage.getItem(TASBEEH_STORAGE);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    return {
      preset: typeof parsed.preset === "string" ? parsed.preset : fallback.preset,
      currentDhikr: typeof parsed.currentDhikr === "string" ? parsed.currentDhikr : fallback.currentDhikr,
      target: normalizeTarget(Number(parsed.target)),
      count: Number.isFinite(parsed.count) ? Math.max(0, Math.round(parsed.count)) : fallback.count,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : fallback.sessions,
    };
  } catch (error) {
    return fallback;
  }
}

function persist() {
  localStorage.setItem(TASBEEH_STORAGE, JSON.stringify(state));
}

function getId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
