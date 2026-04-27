const STORAGE_KEYS = {
  subjects: "study_helper_subjects_v1",
  settings: "study_helper_settings_v2",
  countdown: "study_helper_countdown_v1",
  prayerCache: "study_helper_prayer_cache_v1",
  prayerAlerts: "study_helper_prayer_alerts_v1",
  prayerPrefs: "study_helper_prayer_prefs_v1",
};

const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const PRAYER_LABELS = {
  Fajr: "الفجر",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

const PRAYER_LOCATION = {
  city: "Giza",
  country: "Egypt",
  method: "5",
};

const elements = {
  subjectForm: document.getElementById("subjectForm"),
  subjectName: document.getElementById("subjectName"),
  weeklyHours: document.getElementById("weeklyHours"),
  difficulty: document.getElementById("difficulty"),
  subjectMessage: document.getElementById("subjectMessage"),
  subjectsList: document.getElementById("subjectsList"),
  subjectsEmpty: document.getElementById("subjectsEmpty"),

  scheduleForm: document.getElementById("scheduleForm"),
  startDate: document.getElementById("startDate"),
  daysPerWeek: document.getElementById("daysPerWeek"),
  dailyStart: document.getElementById("dailyStart"),
  studyWindow: document.getElementById("studyWindow"),
  dailyHours: document.getElementById("dailyHours"),
  sessionMinutes: document.getElementById("sessionMinutes"),
  breakMinutes: document.getElementById("breakMinutes"),
  scheduleMessage: document.getElementById("scheduleMessage"),
  scheduleSummary: document.getElementById("scheduleSummary"),
  scheduleOutput: document.getElementById("scheduleOutput"),
  scheduleEmpty: document.getElementById("scheduleEmpty"),

  prayerDate: document.getElementById("prayerDate"),
  prayerList: document.getElementById("prayerList"),
  prayerStatus: document.getElementById("prayerStatus"),
  prayerAlertEnabled: document.getElementById("prayerAlertEnabled"),
  refreshPrayerBtn: document.getElementById("refreshPrayerBtn"),

  stopwatchDisplay: document.getElementById("stopwatchDisplay"),
  startPauseBtn: document.getElementById("startPauseBtn"),
  resetBtn: document.getElementById("resetBtn"),
  countdownHours: document.getElementById("countdownHours"),
  countdownDisplay: document.getElementById("countdownDisplay"),
  countdownStartPauseBtn: document.getElementById("countdownStartPauseBtn"),
  countdownResetBtn: document.getElementById("countdownResetBtn"),
  countdownStatus: document.getElementById("countdownStatus"),
};

function loadJson(key, fallbackValue) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
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

const countdownPrefs = loadJson(STORAGE_KEYS.countdown, { hours: 1 });
const prayerPrefs = loadJson(STORAGE_KEYS.prayerPrefs, { enabled: true });
const initialCountdownHours = (function () {
  const v = Number(countdownPrefs.hours);
  if (!Number.isFinite(v) || v < 1 || v > 5) return 1;
  return Math.floor(v);
})();

const state = {
  subjects: loadJson(STORAGE_KEYS.subjects, []),
  stopwatch: {
    running: false,
    elapsedMs: 0,
    startedAt: null,
    timerId: null,
  },
  countdown: {
    selectedHours: initialCountdownHours,
    running: false,
    remainingMs: initialCountdownHours * 60 * 60 * 1000,
    lastTickAt: null,
    timerId: null,
  },
  prayer: {
    cache: loadJson(STORAGE_KEYS.prayerCache, {}),
    alerts: loadJson(STORAGE_KEYS.prayerAlerts, {}),
    enabled: prayerPrefs.enabled !== false,
    currentDateKey: "",
    currentTimings: null,
    monitorTimerId: null,
    lastMinuteKey: "",
    refreshInProgress: false,
  },
};

function init() {
  loadScheduleSettings();
  renderSubjects();
  setupListeners();
  renderStopwatch();
  renderCountdown();
  sanitizePrayerAlertHistory();
  initPrayerModule();
}

function setupListeners() {
  if (elements.subjectForm) elements.subjectForm.addEventListener("submit", handleAddSubject);
  if (elements.subjectsList) elements.subjectsList.addEventListener("click", handleDeleteSubject);
  if (elements.scheduleForm) elements.scheduleForm.addEventListener("submit", handleGenerateSchedule);
  if (elements.refreshPrayerBtn) elements.refreshPrayerBtn.addEventListener("click", handleManualPrayerRefresh);
  if (elements.prayerAlertEnabled) elements.prayerAlertEnabled.addEventListener("change", handlePrayerAlertToggle);

  if (elements.startPauseBtn) elements.startPauseBtn.addEventListener("click", toggleStopwatch);
  if (elements.resetBtn) elements.resetBtn.addEventListener("click", resetStopwatch);
  if (elements.countdownHours) elements.countdownHours.addEventListener("change", handleCountdownHoursChange);
  if (elements.countdownStartPauseBtn) elements.countdownStartPauseBtn.addEventListener("click", toggleCountdown);
  if (elements.countdownResetBtn) elements.countdownResetBtn.addEventListener("click", resetCountdown);
}

function handleAddSubject(event) {
  if (event && event.preventDefault) event.preventDefault();

  const name = (elements.subjectName && elements.subjectName.value ? elements.subjectName.value.trim() : "");
  const weeklyHours = elements.weeklyHours ? Number(elements.weeklyHours.value) : 0;
  const difficulty = elements.difficulty ? Number(elements.difficulty.value) : 3;

  if (!name) {
    if (elements.subjectMessage) showMessage(elements.subjectMessage, "ادخلي اسم المادة أولًا.", "error");
    return;
  }

  if (!Number.isFinite(weeklyHours) || weeklyHours <= 0) {
    if (elements.subjectMessage) showMessage(elements.subjectMessage, "عدد الساعات لازم يكون أكبر من صفر.", "error");
    return;
  }

  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
    if (elements.subjectMessage) showMessage(elements.subjectMessage, "درجة الصعوبة لازم تكون من 1 إلى 5.", "error");
    return;
  }

  state.subjects.push({
    id: getId(),
    name,
    weeklyHours,
    difficulty,
  });

  saveJson(STORAGE_KEYS.subjects, state.subjects);
  renderSubjects();
  if (elements.subjectMessage) showMessage(elements.subjectMessage, `تمت إضافة "${name}" بنجاح.`, "info");

  if (elements.subjectForm && typeof elements.subjectForm.reset === "function") {
    elements.subjectForm.reset();
    if (elements.weeklyHours) elements.weeklyHours.value = "4";
    if (elements.difficulty) elements.difficulty.value = "3";
  }
}

function renderSubjects() {
  if (!elements.subjectsList) return;
  elements.subjectsList.innerHTML = "";

  if (!state.subjects || state.subjects.length === 0) {
    if (elements.subjectsEmpty) elements.subjectsEmpty.classList.remove("hidden");
    return;
  }

  if (elements.subjectsEmpty) elements.subjectsEmpty.classList.add("hidden");

  for (const subject of state.subjects) {
    const item = document.createElement("li");
    item.className = "subject-item";
    item.innerHTML = `
      <div>
        <h3>${escapeHtml(subject.name)}</h3>
        <p class="subject-meta">ساعات/أسبوع: ${subject.weeklyHours} | صعوبة: ${subject.difficulty}/5</p>
      </div>
      <button class="delete-btn" type="button" data-delete-id="${subject.id}">حذف</button>
    `;
    elements.subjectsList.appendChild(item);
  }
}

function handleDeleteSubject(event) {
  const button = event.target.closest ? event.target.closest("[data-delete-id]") : null;
  if (!button) return;
  const { deleteId } = button.dataset || {};
  if (!deleteId) return;
  state.subjects = state.subjects.filter((s) => s.id !== deleteId);
  saveJson(STORAGE_KEYS.subjects, state.subjects);
  renderSubjects();
  if (elements.subjectMessage) showMessage(elements.subjectMessage, "تم حذف المادة.", "info");
}

function showMessage(element, text, type) {
  if (!element) return;
  element.textContent = text;
  element.className = `msg ${type}`;
}

function loadScheduleSettings() {
  const saved = loadJson(STORAGE_KEYS.settings, null);
  const today = getLocalDateKey(new Date());

  if (!saved) {
    if (elements.startDate) elements.startDate.value = today;
    if (elements.studyWindow) elements.studyWindow.value = "after_iftar";
    if (elements.prayerAlertEnabled) elements.prayerAlertEnabled.checked = state.prayer.enabled;
    return;
  }

  if (elements.startDate) elements.startDate.value = saved.startDate || today;
  if (elements.daysPerWeek) elements.daysPerWeek.value = String(saved.daysPerWeek ?? 6);
  if (elements.dailyStart) elements.dailyStart.value = saved.dailyStart || "16:00";
  if (elements.studyWindow) elements.studyWindow.value = saved.studyWindow || "after_iftar";
  if (elements.dailyHours) elements.dailyHours.value = String(saved.dailyHours ?? 3);
  if (elements.sessionMinutes) elements.sessionMinutes.value = String(saved.sessionMinutes ?? 50);
  if (elements.breakMinutes) elements.breakMinutes.value = String(saved.breakMinutes ?? 10);
  if (elements.prayerAlertEnabled) elements.prayerAlertEnabled.checked = state.prayer.enabled;
}

function handleGenerateSchedule(event) {
  if (event && event.preventDefault) event.preventDefault();

  if (!state.subjects || state.subjects.length === 0) {
    if (elements.scheduleMessage) showMessage(elements.scheduleMessage, "أضف مادة واحدة على الأقل قبل توليد الجدول.", "error");
    return;
  }

  const start = elements.startDate && elements.startDate.value ? new Date(elements.startDate.value) : new Date();
  const daysPerWeek = Math.max(1, Math.min(7, Number(elements.daysPerWeek ? elements.daysPerWeek.value : 6)));
  const dailyStart = elements.dailyStart && elements.dailyStart.value ? elements.dailyStart.value : "16:00";
  const dailyHours = Math.max(0.5, Number(elements.dailyHours ? elements.dailyHours.value : 3));
  const sessionMinutes = Math.max(10, Number(elements.sessionMinutes ? elements.sessionMinutes.value : 50));
  const breakMinutes = Math.max(0, Number(elements.breakMinutes ? elements.breakMinutes.value : 10));

  const periodDays = 28; // 4 weeks
  const weeks = Math.ceil(periodDays / 7);

  // prepare per-subject remaining minutes target (weeklyHours * weeks)
  const subjectTargets = state.subjects.map((s) => ({
    id: s.id,
    name: s.name,
    remainingMin: Math.round((s.weeklyHours || 0) * 60 * weeks),
  }));

  // build calendar days array
  const days = [];
  for (let i = 0; i < periodDays; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const weekdayIndex = (d.getDay() + 6) % 7; // make Monday=0, Sunday=6 but we treat consecutively
    const include = (i % 7) < daysPerWeek; // include first N days each week
    days.push({ date: d, include, sessions: [] });
  }

  // assign sessions per included day
  for (const day of days) {
    if (!day.include) continue;
    const totalMinutesAvailable = Math.round(dailyHours * 60);
    const slotLength = sessionMinutes + breakMinutes;
    const slots = slotLength <= 0 ? 0 : Math.max(0, Math.floor(totalMinutesAvailable / slotLength));
    let slotStart = dailyStart;
    for (let si = 0; si < slots; si++) {
      // pick subject with largest remaining minutes
      subjectTargets.sort((a, b) => b.remainingMin - a.remainingMin);
      const chosen = subjectTargets.find((st) => st.remainingMin > 0) || null;
      if (!chosen) break;

      const minutesForSession = Math.min(sessionMinutes, chosen.remainingMin);
      chosen.remainingMin -= minutesForSession;

      // compute session start/end times
      const [hh, mm] = slotStart.split(":").map((v) => Number(v));
      const startDt = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), hh, mm);
      const endDt = new Date(startDt.getTime() + minutesForSession * 60 * 1000);

      day.sessions.push({
        subjectId: chosen.id,
        subjectName: chosen.name,
        minutes: minutesForSession,
        start: `${pad2(startDt.getHours())}:${pad2(startDt.getMinutes())}`,
        end: `${pad2(endDt.getHours())}:${pad2(endDt.getMinutes())}`,
      });

      // advance slotStart by slotLength minutes
      const nextDt = new Date(startDt.getTime() + slotLength * 60 * 1000);
      slotStart = `${pad2(nextDt.getHours())}:${pad2(nextDt.getMinutes())}`;
    }
  }

  // render schedule
  renderSchedule(days);
  if (elements.scheduleMessage) showMessage(elements.scheduleMessage, `تم توليد جدول لمدة ${periodDays} يومًا.`, "info");
}

function renderSchedule(days) {
  if (!elements.scheduleOutput) return;
  elements.scheduleOutput.innerHTML = "";

  let anySessions = false;
  for (const day of days) {
    const card = document.createElement("div");
    card.className = "day-card";
    const dateLabel = day.date.toLocaleDateString("ar-EG", { weekday: "short", day: "numeric", month: "short" });
    const h = document.createElement("h3");
    h.textContent = dateLabel;
    card.appendChild(h);

    if (!day.include || day.sessions.length === 0) {
      const p = document.createElement("p");
      p.className = "date-text";
      p.textContent = "لا جلسات";
      card.appendChild(p);
    } else {
      anySessions = true;
      const ul = document.createElement("ul");
      ul.className = "session-list";
      for (const s of day.sessions) {
        const li = document.createElement("li");
        li.className = "session-item";
        li.innerHTML = `<strong>${escapeHtml(s.subjectName)}</strong><div class="session-time">${s.start} — ${s.end} · ${s.minutes} دقيقة</div>`;
        ul.appendChild(li);
      }
      card.appendChild(ul);
    }

    elements.scheduleOutput.appendChild(card);
  }

  if (elements.scheduleEmpty) elements.scheduleEmpty.classList.toggle("hidden", anySessions);
}

function sanitizePrayerAlertHistory() {
  const keys = Object.keys(state.prayer.alerts || {});
  const now = new Date();
  const minAllowed = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
  const minKey = getLocalDateKey(minAllowed);

  const filtered = {};
  for (const key of keys) {
    if (key >= minKey) filtered[key] = state.prayer.alerts[key];
  }

  state.prayer.alerts = filtered;
  saveJson(STORAGE_KEYS.prayerAlerts, filtered);
}

function initPrayerModule() {
  // best-effort initialization; keep non-blocking
  (async () => {
    try {
      await refreshTodayPrayerTimes({ forceRefresh: false, announce: false });
    } catch (e) {
      // ignore
    }

    if (state.prayer.enabled) {
      try { if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {}
    }

    state.prayer.monitorTimerId = window.setInterval(() => {
      handlePrayerMinuteTick();
    }, 15000);
  })();
}

// --- Countdown functions ---
function renderCountdown() {
  const rem = state.countdown.remainingMs;
  const hours = Math.floor(rem / (1000 * 60 * 60));
  const minutes = Math.floor((rem % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((rem % (1000 * 60)) / 1000);
  if (elements.countdownDisplay) elements.countdownDisplay.textContent = `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  if (elements.countdownHours) elements.countdownHours.value = String(state.countdown.selectedHours);
  if (state.countdown.running) {
    if (elements.countdownStartPauseBtn) elements.countdownStartPauseBtn.textContent = "إيقاف";
    if (elements.countdownStatus) elements.countdownStatus.classList.add("hidden");
  } else {
    if (elements.countdownStartPauseBtn) elements.countdownStartPauseBtn.textContent = "ابدأ العد";
  }
}

function handleCountdownHoursChange() {
  const v = Number(elements.countdownHours ? elements.countdownHours.value : state.countdown.selectedHours);
  const hours = Number.isFinite(v) && v >= 1 && v <= 5 ? Math.floor(v) : 1;
  state.countdown.selectedHours = hours;
  state.countdown.remainingMs = hours * 60 * 60 * 1000;
  saveJson(STORAGE_KEYS.countdown, { hours });
  renderCountdown();
}

function toggleCountdown() {
  if (!state.countdown.running) {
    state.countdown.running = true;
    state.countdown.lastTickAt = Date.now();
    state.countdown.timerId = setInterval(() => {
      const now = Date.now();
      const delta = now - (state.countdown.lastTickAt || now);
      state.countdown.lastTickAt = now;
      state.countdown.remainingMs = Math.max(0, state.countdown.remainingMs - delta);
      renderCountdown();
      if (state.countdown.remainingMs <= 0) {
        clearInterval(state.countdown.timerId);
        state.countdown.running = false;
        state.countdown.timerId = null;
        if (elements.countdownStatus) { elements.countdownStatus.textContent = "انتهى العد"; elements.countdownStatus.classList.remove("hidden"); }
      }
    }, 500);
  } else {
    if (state.countdown.timerId) clearInterval(state.countdown.timerId);
    state.countdown.running = false;
    state.countdown.timerId = null;
  }
  renderCountdown();
}

function resetCountdown() {
  if (state.countdown.timerId) { clearInterval(state.countdown.timerId); state.countdown.timerId = null; }
  state.countdown.running = false;
  state.countdown.remainingMs = state.countdown.selectedHours * 60 * 60 * 1000;
  renderCountdown();
}

// --- Prayer helpers (lightweight/mock) ---
async function refreshTodayPrayerTimes({ forceRefresh = false, announce = false } = {}) {
  const todayKey = getLocalDateKey(new Date());
  if (!forceRefresh && state.prayer.cache && state.prayer.cache[todayKey]) {
    state.prayer.currentTimings = state.prayer.cache[todayKey];
    state.prayer.currentDateKey = todayKey;
    renderPrayerList();
    return state.prayer.currentTimings;
  }

  // simple fixed times for demonstration; real implementation should call an API
  const timings = {
    Fajr: "05:00",
    Dhuhr: "12:00",
    Asr: "15:00",
    Maghrib: "18:00",
    Isha: "20:00",
  };

  state.prayer.currentTimings = timings;
  state.prayer.currentDateKey = todayKey;
  state.prayer.cache[todayKey] = timings;
  saveJson(STORAGE_KEYS.prayerCache, state.prayer.cache);
  renderPrayerList();
  if (announce && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification('مواقيت الصلاة', { body: 'تم تحديث مواقيت اليوم.' });
  }
  return timings;
}

function isPrayerAlerted(todayKey, prayerName) {
  const rec = state.prayer.alerts || {};
  return Array.isArray(rec[todayKey]) && rec[todayKey].includes(prayerName);
}

function markPrayerAlerted(todayKey, prayerName) {
  state.prayer.alerts = state.prayer.alerts || {};
  state.prayer.alerts[todayKey] = state.prayer.alerts[todayKey] || [];
  if (!state.prayer.alerts[todayKey].includes(prayerName)) state.prayer.alerts[todayKey].push(prayerName);
  saveJson(STORAGE_KEYS.prayerAlerts, state.prayer.alerts);
}

function firePrayerAlert(prayerName, timeStr) {
  if (elements.prayerStatus) elements.prayerStatus.textContent = `الآن: ${PRAYER_LABELS[prayerName] || prayerName} ${timeStr}`;
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(`وقت الصلاة - ${PRAYER_LABELS[prayerName] || prayerName}`, { body: `الوقت: ${timeStr}` });
    }
  } catch (e) {}
}

function renderPrayerList() {
  if (!elements.prayerList) return;
  elements.prayerList.innerHTML = "";
  if (!state.prayer.currentTimings) {
    if (elements.prayerStatus) elements.prayerStatus.textContent = "لا توجد مواقيت حالياً.";
    return;
  }
  const todayLabel = new Date().toLocaleDateString('ar-EG');
  if (elements.prayerDate) elements.prayerDate.textContent = todayLabel;
  for (const name of PRAYER_ORDER) {
    const li = document.createElement('li');
    li.className = 'prayer-item';
    const time = state.prayer.currentTimings[name] || '';
    li.innerHTML = `<div><strong>${PRAYER_LABELS[name] || name}</strong></div><div class="prayer-time">${time}</div>`;
    elements.prayerList.appendChild(li);
  }
}

function handleManualPrayerRefresh() {
  (async () => {
    if (elements.refreshPrayerBtn) elements.refreshPrayerBtn.disabled = true;
    try { await refreshTodayPrayerTimes({ forceRefresh: true, announce: true }); } catch (e) {}
    if (elements.refreshPrayerBtn) elements.refreshPrayerBtn.disabled = false;
  })();
}

function handlePrayerAlertToggle() {
  state.prayer.enabled = elements.prayerAlertEnabled ? elements.prayerAlertEnabled.checked : false;
  saveJson(STORAGE_KEYS.prayerPrefs, { enabled: state.prayer.enabled });
  if (state.prayer.enabled) {
    try { if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {}
    if (elements.prayerStatus) elements.prayerStatus.textContent = "تنبيهات الصلاة مفعلة.";
  } else {
    if (elements.prayerStatus) elements.prayerStatus.textContent = "تنبيهات الصلاة متوقفة.";
  }
}

function handlePrayerMinuteTick() {
  const now = new Date();
  const todayKey = getLocalDateKey(now);
  if (state.prayer.currentDateKey !== todayKey && !state.prayer.refreshInProgress) {
    refreshTodayPrayerTimes({ forceRefresh: false, announce: false });
    return;
  }

  if (!state.prayer.currentTimings || !state.prayer.enabled) return;

  const minuteKey = `${todayKey}_${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  if (minuteKey === state.prayer.lastMinuteKey) return;
  state.prayer.lastMinuteKey = minuteKey;

  const currentHHMM = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  for (const prayerName of PRAYER_ORDER) {
    if (state.prayer.currentTimings[prayerName] !== currentHHMM) continue;
    if (isPrayerAlerted(todayKey, prayerName)) continue;
    markPrayerAlerted(todayKey, prayerName);
    firePrayerAlert(prayerName, currentHHMM);
  }
}

function formatTime12FromHHMM(hhmm) {
  if (!hhmm) return "";
  const [hours, minutes] = hhmm.split(":").map(Number);
  const date = new Date(2000, 0, 1, hours, minutes, 0, 0);
  return date.toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit", hour12: true });
}

function pad2(v) { return String(v).padStart(2,'0'); }
function getLocalDateKey(date) { return `${date.getFullYear()}-${pad2(date.getMonth()+1)}-${pad2(date.getDate())}`; }

// minimal timer/countdown/stopwatch functions (kept simple)
function renderStopwatch() {
  const elapsed = state.stopwatch.elapsedMs + (state.stopwatch.running && state.stopwatch.startedAt ? Date.now() - state.stopwatch.startedAt : 0);
  if (elements.stopwatchDisplay) elements.stopwatchDisplay.textContent = formatDuration(elapsed);
  if (elements.startPauseBtn) elements.startPauseBtn.textContent = state.stopwatch.running ? "إيقاف مؤقت" : (elapsed === 0 ? "ابدأ" : "استكمال");
}

function toggleStopwatch() {
  if (!state.stopwatch.running) {
    state.stopwatch.running = true;
    state.stopwatch.startedAt = Date.now();
    state.stopwatch.timerId = window.setInterval(renderStopwatch, 200);
  } else {
    const now = Date.now();
    state.stopwatch.elapsedMs += now - (state.stopwatch.startedAt || now);
    state.stopwatch.running = false;
    state.stopwatch.startedAt = null;
    if (state.stopwatch.timerId) { clearInterval(state.stopwatch.timerId); state.stopwatch.timerId = null; }
  }
  renderStopwatch();
}

function resetStopwatch() {
  if (state.stopwatch.timerId) { clearInterval(state.stopwatch.timerId); }
  state.stopwatch.running = false; state.stopwatch.elapsedMs = 0; state.stopwatch.startedAt = null; state.stopwatch.timerId = null;
  renderStopwatch();
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.floor(milliseconds/1000);
  const hours = Math.floor(totalSeconds/3600);
  const minutes = Math.floor((totalSeconds%3600)/60);
  const seconds = totalSeconds % 60;
  return [hours,minutes,seconds].map(v=>String(v).padStart(2,'0')).join(":");
}

function applyThemeNoop() { /* theme removed */ }

// init after DOM loads to account for elements present
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
