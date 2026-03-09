const STORAGE_KEY = "ai-smart-study-tracker-v1";
const THEME_KEY = "ai-smart-study-tracker-theme";
const SUBJECTS = ["Physics", "Chemistry", "Maths"];
const SVG_NS = "http://www.w3.org/2000/svg";

const dom = {
  body: document.body,
  todayStamp: document.getElementById("todayStamp"),
  consistencyBadge: document.getElementById("consistencyBadge"),
  heroHeadline: document.getElementById("heroHeadline"),
  heroText: document.getElementById("heroText"),
  nextDayTarget: document.getElementById("nextDayTarget"),
  backlogPressure: document.getElementById("backlogPressure"),
  weakSubjectHero: document.getElementById("weakSubjectHero"),
  studyStreak: document.getElementById("studyStreak"),
  streakFill: document.getElementById("streakFill"),
  streakNote: document.getElementById("streakNote"),
  todayHours: document.getElementById("todayHours"),
  todayQuestions: document.getElementById("todayQuestions"),
  todayLectures: document.getElementById("todayLectures"),
  pendingBacklog: document.getElementById("pendingBacklog"),
  weeklyScore: document.getElementById("weeklyScore"),
  weeklyConsistency: document.getElementById("weeklyConsistency"),
  weakSubject: document.getElementById("weakSubject"),
  weakSubjectNote: document.getElementById("weakSubjectNote"),
  consistencyDays: document.getElementById("consistencyDays"),
  consistencyNote: document.getElementById("consistencyNote"),
  backlogWarning: document.getElementById("backlogWarning"),
  backlogWarningNote: document.getElementById("backlogWarningNote"),
  nextDayHours: document.getElementById("nextDayHours"),
  nextDayNote: document.getElementById("nextDayNote"),
  unfinishedLectures: document.getElementById("unfinishedLectures"),
  pendingQuestions: document.getElementById("pendingQuestions"),
  missedTargets: document.getElementById("missedTargets"),
  backlogList: document.getElementById("backlogList"),
  weeklyHoursChart: document.getElementById("weeklyHoursChart"),
  subjectQuestionsChart: document.getElementById("subjectQuestionsChart"),
  chapterProgressList: document.getElementById("chapterProgressList"),
  studyLogList: document.getElementById("studyLogList"),
  testTrendChart: document.getElementById("testTrendChart"),
  testSummaryList: document.getElementById("testSummaryList"),
  testList: document.getElementById("testList"),
  demoDataBtn: document.getElementById("demoDataBtn"),
  themeToggleBtn: document.getElementById("themeToggleBtn"),
  installAppBtn: document.getElementById("installAppBtn"),
  clearStudyLogsBtn: document.getElementById("clearStudyLogsBtn"),
  clearTestsBtn: document.getElementById("clearTestsBtn"),
  studyEntryForm: document.getElementById("studyEntryForm"),
  entryDate: document.getElementById("entryDate"),
  entrySubject: document.getElementById("entrySubject"),
  entryChapter: document.getElementById("entryChapter"),
  plannedLectures: document.getElementById("plannedLectures"),
  lecturesCompleted: document.getElementById("lecturesCompleted"),
  plannedQuestions: document.getElementById("plannedQuestions"),
  questionsSolved: document.getElementById("questionsSolved"),
  targetHours: document.getElementById("targetHours"),
  studyHours: document.getElementById("studyHours"),
  revisionDone: document.getElementById("revisionDone"),
  entryNotes: document.getElementById("entryNotes"),
  focusRating: document.getElementById("focusRating"),
  focusRatingValue: document.getElementById("focusRatingValue"),
  testForm: document.getElementById("testForm"),
  testName: document.getElementById("testName"),
  testDate: document.getElementById("testDate"),
  testScore: document.getElementById("testScore"),
  testMaxMarks: document.getElementById("testMaxMarks"),
  physicsMarks: document.getElementById("physicsMarks"),
  chemistryMarks: document.getElementById("chemistryMarks"),
  mathsMarks: document.getElementById("mathsMarks")
};

const formatters = {
  dayChip: new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }),
  fullDate: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }),
  shortMonth: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" })
};

let deferredInstallPrompt = null;

const state = {
  theme: loadTheme(),
  studyLogs: [],
  tests: []
};

hydrateState();
applyTheme(state.theme);
setFormDefaults();
renderAll();
attachEvents();

function hydrateState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      state.studyLogs = [];
      state.tests = [];
      return;
    }

    const parsed = JSON.parse(raw);
    state.studyLogs = Array.isArray(parsed.studyLogs) ? parsed.studyLogs.map(normalizeStudyLog).filter(Boolean) : [];
    state.tests = Array.isArray(parsed.tests) ? parsed.tests.map(normalizeTest).filter(Boolean) : [];
  } catch (error) {
    console.warn("Could not read tracker data.", error);
    state.studyLogs = [];
    state.tests = [];
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      studyLogs: state.studyLogs,
      tests: state.tests
    })
  );
}

function saveTheme() {
  localStorage.setItem(THEME_KEY, state.theme);
}

function applyTheme(theme) {
  dom.body.dataset.theme = theme;
  dom.themeToggleBtn.textContent = theme === "dark" ? "Light mode" : "Dark mode";
}

function setFormDefaults() {
  const today = getTodayStamp();
  dom.entryDate.value = today;
  dom.testDate.value = today;
  dom.focusRatingValue.textContent = `${dom.focusRating.value}/10`;
}

function attachEvents() {
  dom.focusRating.addEventListener("input", () => {
    dom.focusRatingValue.textContent = `${dom.focusRating.value}/10`;
  });

  dom.studyEntryForm.addEventListener("submit", handleStudyEntrySubmit);
  dom.testForm.addEventListener("submit", handleTestSubmit);
  dom.themeToggleBtn.addEventListener("click", toggleTheme);
  dom.installAppBtn.addEventListener("click", installApp);
  dom.demoDataBtn.addEventListener("click", loadDemoData);
  dom.clearStudyLogsBtn.addEventListener("click", clearStudyLogs);
  dom.clearTestsBtn.addEventListener("click", clearTests);
  dom.studyLogList.addEventListener("click", handleLogActions);
  dom.testList.addEventListener("click", handleTestActions);

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      hydrateState();
      renderAll();
    }

    if (event.key === THEME_KEY) {
      state.theme = loadTheme();
      applyTheme(state.theme);
    }
  });
}

function initAppMode() {
  syncAppMode();
  registerServiceWorker();

  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.addEventListener("appinstalled", handleAppInstalled);

  if (window.matchMedia) {
    const displayModeQuery = window.matchMedia("(display-mode: standalone)");
    if (typeof displayModeQuery.addEventListener === "function") {
      displayModeQuery.addEventListener("change", syncAppMode);
    }
  }

  if (window.location.protocol === "file:") {
    dom.installAppBtn.hidden = true;
  }
}

function syncAppMode() {
  const isStandalone =
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true;

  dom.body.classList.toggle("app-installed", isStandalone);

  if (isStandalone) {
    dom.installAppBtn.hidden = true;
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || window.location.protocol === "file:") {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.warn("Service worker registration failed.", error);
    });
  });
}

function handleBeforeInstallPrompt(event) {
  event.preventDefault();
  deferredInstallPrompt = event;
  dom.installAppBtn.hidden = false;
  dom.installAppBtn.textContent = "Install App";
}

async function installApp() {
  if (!deferredInstallPrompt) {
    return;
  }

  deferredInstallPrompt.prompt();

  try {
    const result = await deferredInstallPrompt.userChoice;
    if (result && result.outcome === "accepted") {
      dom.installAppBtn.hidden = true;
    }
  } catch (error) {
    console.warn("Install prompt failed.", error);
  } finally {
    deferredInstallPrompt = null;
  }
}

function handleAppInstalled() {
  deferredInstallPrompt = null;
  dom.installAppBtn.hidden = true;
  syncAppMode();
}

function handleStudyEntrySubmit(event) {
  event.preventDefault();

  const log = normalizeStudyLog({
    id: createId(),
    date: dom.entryDate.value,
    subject: dom.entrySubject.value,
    chapter: dom.entryChapter.value,
    plannedLectures: dom.plannedLectures.value,
    lecturesCompleted: dom.lecturesCompleted.value,
    plannedQuestions: dom.plannedQuestions.value,
    questionsSolved: dom.questionsSolved.value,
    targetHours: dom.targetHours.value,
    studyHours: dom.studyHours.value,
    revisionDone: dom.revisionDone.checked,
    notes: dom.entryNotes.value,
    focusRating: dom.focusRating.value,
    createdAt: new Date().toISOString()
  });

  if (!log) {
    return;
  }

  state.studyLogs.unshift(log);
  sortStudyLogs();
  saveState();
  dom.studyEntryForm.reset();
  setFormDefaults();
  dom.entrySubject.value = log.subject;
  renderAll();
}

function handleTestSubmit(event) {
  event.preventDefault();

  const test = normalizeTest({
    id: createId(),
    name: dom.testName.value,
    date: dom.testDate.value,
    score: dom.testScore.value,
    maxMarks: dom.testMaxMarks.value,
    physicsMarks: dom.physicsMarks.value,
    chemistryMarks: dom.chemistryMarks.value,
    mathsMarks: dom.mathsMarks.value,
    createdAt: new Date().toISOString()
  });

  if (!test) {
    return;
  }

  state.tests.unshift(test);
  sortTests();
  saveState();
  dom.testForm.reset();
  setFormDefaults();
  dom.testMaxMarks.value = "300";
  renderAll();
}

function handleLogActions(event) {
  const button = event.target.closest("[data-log-id]");
  if (!button) {
    return;
  }

  const id = button.dataset.logId;
  state.studyLogs = state.studyLogs.filter((log) => log.id !== id);
  saveState();
  renderAll();
}

function handleTestActions(event) {
  const button = event.target.closest("[data-test-id]");
  if (!button) {
    return;
  }

  const id = button.dataset.testId;
  state.tests = state.tests.filter((test) => test.id !== id);
  saveState();
  renderAll();
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme(state.theme);
  saveTheme();
}

function clearStudyLogs() {
  if (!state.studyLogs.length) {
    return;
  }

  const shouldClear = window.confirm("Clear all study logs?");
  if (!shouldClear) {
    return;
  }

  state.studyLogs = [];
  saveState();
  renderAll();
}

function clearTests() {
  if (!state.tests.length) {
    return;
  }

  const shouldClear = window.confirm("Clear all saved tests?");
  if (!shouldClear) {
    return;
  }

  state.tests = [];
  saveState();
  renderAll();
}

function loadDemoData() {
  const hasExistingData = state.studyLogs.length > 0 || state.tests.length > 0;
  if (hasExistingData) {
    const shouldReplace = window.confirm("Replace current data with demo study data?");
    if (!shouldReplace) {
      return;
    }
  }

  const demo = createDemoData();
  state.studyLogs = demo.studyLogs;
  state.tests = demo.tests;
  sortStudyLogs();
  sortTests();
  saveState();
  renderAll();
}
function renderAll() {
  const metrics = getMetrics();
  renderHeader(metrics);
  renderAiInsights(metrics);
  renderBacklog(metrics.backlog);
  renderCharts(metrics);
  renderStudyLogs(metrics.studyLogs);
  renderTests(metrics.tests);
}

function getMetrics() {
  sortStudyLogs();
  sortTests();

  const today = getTodayStamp();
  const todayLogs = state.studyLogs.filter((log) => log.date === today);
  const todayHours = sum(todayLogs, "studyHours");
  const todayQuestions = sum(todayLogs, "questionsSolved");
  const todayLectures = sum(todayLogs, "lecturesCompleted");
  const backlog = getBacklogMetrics(state.studyLogs);
  const weekly = getWeeklyMetrics(state.studyLogs);
  const streak = getStudyStreak(state.studyLogs);
  const weakSubject = getWeakSubject(state.studyLogs, state.tests);
  const lowConsistency = getLowConsistencyDays(state.studyLogs);
  const nextDayHours = getSuggestedNextDayHours(state.studyLogs, state.tests, backlog);
  const chapterProgress = getChapterProgress(state.studyLogs);
  const subjectQuestions = getSubjectQuestionTotals(state.studyLogs);
  const testTrend = getTestTrend(state.tests);

  return {
    today,
    todayHours,
    todayQuestions,
    todayLectures,
    backlog,
    weekly,
    streak,
    weakSubject,
    lowConsistency,
    nextDayHours,
    chapterProgress,
    subjectQuestions,
    testTrend,
    studyLogs: state.studyLogs.slice(0, 8),
    tests: state.tests.slice(0, 6)
  };
}

function renderHeader(metrics) {
  const backlogCount = metrics.backlog.items.length;
  const backlogPressure = getBacklogPressure(metrics.backlog);
  const weakSubjectLabel = metrics.weakSubject ? metrics.weakSubject.subject : "Balanced";

  dom.todayStamp.textContent = `Today | ${formatters.dayChip.format(parseDate(metrics.today))}`;
  dom.consistencyBadge.textContent = `${metrics.weekly.activeDays}/7 active days this week`;
  dom.todayHours.textContent = formatHours(metrics.todayHours);
  dom.todayQuestions.textContent = String(metrics.todayQuestions);
  dom.todayLectures.textContent = String(metrics.todayLectures);
  dom.pendingBacklog.textContent = String(backlogCount);
  dom.weeklyScore.textContent = String(metrics.weekly.productivityScore);
  dom.weeklyConsistency.textContent = `${metrics.weekly.consistencyRate}%`;
  dom.studyStreak.textContent = String(metrics.streak.days);
  dom.streakFill.style.width = `${Math.min(metrics.streak.days * 12.5, 100)}%`;
  dom.streakNote.textContent = metrics.streak.note;
  dom.nextDayTarget.textContent = `${formatHours(metrics.nextDayHours)} hrs`;
  dom.backlogPressure.textContent = backlogPressure;
  dom.weakSubjectHero.textContent = weakSubjectLabel;

  if (!state.studyLogs.length) {
    dom.heroHeadline.textContent = "Build disciplined prep, one focused day at a time.";
    dom.heroText.textContent = "Start logging lectures, questions, study hours, and tests. The tracker will turn your raw effort into a clear progress system.";
    return;
  }

  if (backlogPressure === "High") {
    dom.heroHeadline.textContent = "Backlog is rising. Tighten tomorrow before it snowballs.";
    dom.heroText.textContent = `You currently have ${backlogCount} backlog items. Reduce pending questions and unfinished lectures before adding more fresh work.`;
    return;
  }

  if (metrics.weekly.productivityScore >= 75) {
    dom.heroHeadline.textContent = "Your weekly rhythm looks strong and exam-focused.";
    dom.heroText.textContent = `Keep the streak alive. ${weakSubjectLabel} still needs smart revision, but your overall prep tempo is improving.`;
    return;
  }

  dom.heroHeadline.textContent = `Focus the next push on ${weakSubjectLabel}.`;
  dom.heroText.textContent = `Your recent effort suggests a ${formatHours(metrics.nextDayHours)} hour plan tomorrow. Prioritize weak areas first, then finish backlog work.`;
}

function renderAiInsights(metrics) {
  if (!metrics.weakSubject) {
    dom.weakSubject.textContent = "No signal yet";
    dom.weakSubjectNote.textContent = "Add a few study sessions or tests to identify your weakest area.";
  } else {
    dom.weakSubject.textContent = metrics.weakSubject.subject;
    dom.weakSubjectNote.textContent = metrics.weakSubject.note;
  }

  if (!metrics.lowConsistency.days.length) {
    dom.consistencyDays.textContent = "No major gaps";
    dom.consistencyNote.textContent = "Your last two weeks do not show any serious low-output day clusters.";
  } else {
    dom.consistencyDays.textContent = metrics.lowConsistency.days.join(", ");
    dom.consistencyNote.textContent = metrics.lowConsistency.note;
  }

  if (!metrics.backlog.items.length) {
    dom.backlogWarning.textContent = "Backlog under control";
    dom.backlogWarningNote.textContent = "No unfinished lectures, pending questions, or missed target hours are active right now.";
  } else {
    dom.backlogWarning.textContent = `${metrics.backlog.items.length} backlog item${metrics.backlog.items.length === 1 ? "" : "s"}`;
    dom.backlogWarningNote.textContent = `Pending work includes ${metrics.backlog.unfinishedLectures} lectures, ${metrics.backlog.pendingQuestions} questions, and ${formatHours(metrics.backlog.missedHours)} missed target hours.`;
  }

  dom.nextDayHours.textContent = `${formatHours(metrics.nextDayHours)} hours`;
  dom.nextDayNote.textContent = `Suggested plan: ${formatHours(metrics.nextDayHours)} hours with ${metrics.weakSubject ? metrics.weakSubject.subject : "core subjects"} as first priority, then backlog cleanup.`;
}

function renderBacklog(backlog) {
  dom.unfinishedLectures.textContent = String(backlog.unfinishedLectures);
  dom.pendingQuestions.textContent = String(backlog.pendingQuestions);
  dom.missedTargets.textContent = String(backlog.itemCount);
  clearChildren(dom.backlogList);

  if (!backlog.items.length) {
    dom.backlogList.appendChild(createEmptyState("No backlog right now. Stay consistent and keep it clean."));
    return;
  }

  backlog.items.slice(0, 6).forEach((item) => {
    const card = document.createElement("article");
    card.className = "backlog-item";

    const textWrap = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = `${item.subject} | ${item.chapter}`;
    const note = document.createElement("p");
    note.className = "list-note";
    note.textContent = item.note;
    textWrap.append(title, note);

    const date = document.createElement("span");
    date.className = "record-pill";
    date.textContent = formatters.shortMonth.format(parseDate(item.date));

    card.append(textWrap, date);
    dom.backlogList.appendChild(card);
  });
}

function renderCharts(metrics) {
  renderBarChart(dom.weeklyHoursChart, metrics.weekly.dailyHours, (value) => `${formatHours(value)}h`);
  renderBarChart(dom.subjectQuestionsChart, metrics.subjectQuestions, (value) => String(value));
  renderChapterProgress(metrics.chapterProgress);
  renderTestTrend(metrics.testTrend);
}

function renderStudyLogs(logs) {
  clearChildren(dom.studyLogList);

  if (!logs.length) {
    dom.studyLogList.appendChild(createEmptyState("No study logs yet. Add your first study session to start the tracker."));
    return;
  }

  logs.forEach((log) => {
    const card = document.createElement("article");
    card.className = "record-card";

    const head = document.createElement("div");
    head.className = "record-card-head";

    const titleWrap = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = `${log.subject} | ${log.chapter}`;
    const meta = document.createElement("div");
    meta.className = "record-meta";
    meta.textContent = `${formatters.fullDate.format(parseDate(log.date))} | ${formatHours(log.studyHours)} study hours | Focus ${log.focusRating}/10`;
    titleWrap.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "record-actions";
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "icon-button";
    deleteBtn.dataset.logId = log.id;
    deleteBtn.textContent = "Delete";
    actions.appendChild(deleteBtn);

    head.append(titleWrap, actions);

    const pills = document.createElement("div");
    pills.className = "record-pill-group";
    pills.append(
      createPill(`${log.lecturesCompleted} lectures`),
      createPill(`${log.questionsSolved} questions`),
      createPill(log.revisionDone ? "Revision done" : "No revision")
    );

    const foot = document.createElement("div");
    foot.className = "record-card-foot";
    const backlogText = document.createElement("span");
    backlogText.className = "record-meta";
    backlogText.textContent = buildBacklogLine(log);
    foot.appendChild(backlogText);

    card.append(head, pills);

    if (log.notes) {
      const notes = document.createElement("p");
      notes.className = "record-notes";
      notes.textContent = log.notes;
      card.appendChild(notes);
    }

    card.appendChild(foot);
    dom.studyLogList.appendChild(card);
  });
}

function renderTests(tests) {
  clearChildren(dom.testList);
  clearChildren(dom.testSummaryList);

  if (!tests.length) {
    dom.testList.appendChild(createEmptyState("No tests added yet. Save mock tests to see performance trends."));
    dom.testSummaryList.appendChild(createEmptyState("The trend chart becomes active once test records are added."));
    return;
  }

  tests.forEach((test) => {
    const card = document.createElement("article");
    card.className = "record-card";

    const head = document.createElement("div");
    head.className = "record-card-head";

    const titleWrap = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = test.name;
    const meta = document.createElement("div");
    meta.className = "record-meta";
    meta.textContent = `${formatters.fullDate.format(parseDate(test.date))} | ${test.score}/${test.maxMarks} (${Math.round(test.percentage)}%)`;
    titleWrap.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "record-actions";
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "icon-button";
    deleteBtn.dataset.testId = test.id;
    deleteBtn.textContent = "Delete";
    actions.appendChild(deleteBtn);

    head.append(titleWrap, actions);

    const pills = document.createElement("div");
    pills.className = "record-pill-group";
    pills.append(
      createPill(`P ${test.physicsMarks}`),
      createPill(`C ${test.chemistryMarks}`),
      createPill(`M ${test.mathsMarks}`)
    );

    card.append(head, pills);
    dom.testList.appendChild(card);
  });

  state.tests.slice(0, 4).forEach((test) => {
    const summary = document.createElement("article");
    summary.className = "record-card";
    const title = document.createElement("strong");
    title.textContent = test.name;
    const meta = document.createElement("div");
    meta.className = "record-meta";
    meta.textContent = `${Math.round(test.percentage)}% overall | ${formatters.shortMonth.format(parseDate(test.date))}`;
    summary.append(title, meta);
    dom.testSummaryList.appendChild(summary);
  });
}
function renderBarChart(container, data, formatter) {
  clearChildren(container);

  if (!data.length) {
    container.appendChild(createEmptyState("No data yet."));
    return;
  }

  const maxValue = Math.max(...data.map((item) => item.value), 1);

  data.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "bar-chart-item";

    const value = document.createElement("strong");
    value.textContent = formatter(item.value);

    const barWrap = document.createElement("div");
    barWrap.className = "bar-chart-bar-wrap";

    const bar = document.createElement("div");
    bar.className = "bar-chart-bar";
    bar.style.height = `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 12 : 4)}%`;
    barWrap.appendChild(bar);

    const label = document.createElement("span");
    label.textContent = item.label;

    wrapper.append(value, barWrap, label);
    container.appendChild(wrapper);
  });
}

function renderChapterProgress(rows) {
  clearChildren(dom.chapterProgressList);

  if (!rows.length) {
    dom.chapterProgressList.appendChild(createEmptyState("Chapter completion starts showing once you log topics."));
    return;
  }

  rows.slice(0, 6).forEach((row) => {
    const card = document.createElement("article");
    card.className = "progress-row";

    const head = document.createElement("div");
    head.className = "progress-row-head";

    const title = document.createElement("strong");
    title.textContent = `${row.subject} | ${row.chapter}`;
    const percent = document.createElement("span");
    percent.className = "record-meta";
    percent.textContent = `${row.percent}% complete`;
    head.append(title, percent);

    const track = document.createElement("div");
    track.className = "progress-track";
    const fill = document.createElement("div");
    fill.className = "progress-track-fill";
    fill.style.width = `${row.percent}%`;
    track.appendChild(fill);

    const note = document.createElement("div");
    note.className = "record-meta";
    note.textContent = row.note;

    card.append(head, track, note);
    dom.chapterProgressList.appendChild(card);
  });
}

function renderTestTrend(points) {
  while (dom.testTrendChart.firstChild) {
    dom.testTrendChart.removeChild(dom.testTrendChart.firstChild);
  }

  const width = 460;
  const height = 220;
  const padding = { top: 24, right: 24, bottom: 32, left: 34 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  if (!points.length) {
    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", String(width / 2));
    text.setAttribute("y", String(height / 2));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("class", "chart-label");
    text.textContent = "Add tests to unlock the trend graph";
    dom.testTrendChart.appendChild(text);
    return;
  }

  const maxValue = Math.max(...points.map((point) => point.value), 100);
  const minValue = 0;
  const gridLevels = 4;

  for (let level = 0; level <= gridLevels; level += 1) {
    const y = padding.top + (chartHeight / gridLevels) * level;
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", String(padding.left));
    line.setAttribute("x2", String(width - padding.right));
    line.setAttribute("y1", String(y));
    line.setAttribute("y2", String(y));
    line.setAttribute("stroke", "currentColor");
    line.setAttribute("opacity", "0.08");
    dom.testTrendChart.appendChild(line);

    const axis = document.createElementNS(SVG_NS, "text");
    axis.setAttribute("x", "8");
    axis.setAttribute("y", String(y + 4));
    axis.setAttribute("class", "chart-axis");
    axis.textContent = `${Math.round(maxValue - ((maxValue - minValue) / gridLevels) * level)}%`;
    dom.testTrendChart.appendChild(axis);
  }

  const coords = points.map((point, index) => {
    const x = padding.left + (chartWidth / Math.max(points.length - 1, 1)) * index;
    const y = padding.top + chartHeight - ((point.value - minValue) / Math.max(maxValue - minValue, 1)) * chartHeight;
    return { ...point, x, y };
  });

  const polyline = document.createElementNS(SVG_NS, "polyline");
  polyline.setAttribute("points", coords.map((point) => `${point.x},${point.y}`).join(" "));
  polyline.setAttribute("class", "chart-line");

  const area = document.createElementNS(SVG_NS, "path");
  const areaPath = [`M ${coords[0].x} ${padding.top + chartHeight}`]
    .concat(coords.map((point) => `L ${point.x} ${point.y}`))
    .concat(`L ${coords[coords.length - 1].x} ${padding.top + chartHeight} Z`)
    .join(" ");
  area.setAttribute("d", areaPath);
  area.setAttribute("class", "chart-area");

  dom.testTrendChart.append(area, polyline);

  coords.forEach((point) => {
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("cx", String(point.x));
    circle.setAttribute("cy", String(point.y));
    circle.setAttribute("r", "5.5");
    circle.setAttribute("class", "chart-point");
    dom.testTrendChart.appendChild(circle);

    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("x", String(point.x));
    label.setAttribute("y", String(height - 10));
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("class", "chart-label");
    label.textContent = point.label;
    dom.testTrendChart.appendChild(label);
  });
}

function getBacklogMetrics(logs) {
  const items = logs
    .map((log) => {
      const unfinishedLectures = Math.max(log.plannedLectures - log.lecturesCompleted, 0);
      const pendingQuestions = Math.max(log.plannedQuestions - log.questionsSolved, 0);
      const missedHours = Math.max(log.targetHours - log.studyHours, 0);
      const fragments = [];

      if (unfinishedLectures > 0) {
        fragments.push(`${unfinishedLectures} lecture${unfinishedLectures === 1 ? "" : "s"} left`);
      }

      if (pendingQuestions > 0) {
        fragments.push(`${pendingQuestions} question${pendingQuestions === 1 ? "" : "s"} pending`);
      }

      if (missedHours > 0) {
        fragments.push(`${formatHours(missedHours)} hrs short`);
      }

      if (!fragments.length) {
        return null;
      }

      return {
        id: log.id,
        date: log.date,
        subject: log.subject,
        chapter: log.chapter,
        unfinishedLectures,
        pendingQuestions,
        missedHours,
        note: fragments.join(" | ")
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.pendingQuestions + b.unfinishedLectures - (a.pendingQuestions + a.unfinishedLectures));

  return {
    items,
    itemCount: items.filter((item) => item.missedHours > 0).length,
    unfinishedLectures: items.reduce((sumValue, item) => sumValue + item.unfinishedLectures, 0),
    pendingQuestions: items.reduce((sumValue, item) => sumValue + item.pendingQuestions, 0),
    missedHours: items.reduce((sumValue, item) => sumValue + item.missedHours, 0)
  };
}

function getWeeklyMetrics(logs) {
  const last7 = getLastDateStamps(7);
  const grouped = groupLogsByDate(logs);
  const dailyHours = last7.map((date) => ({
    label: formatters.dayChip.format(parseDate(date)).split(" ")[0],
    value: roundTo(grouped.get(date)?.reduce((sumValue, log) => sumValue + log.studyHours, 0) || 0, 1)
  }));
  const activeDays = dailyHours.filter((entry) => entry.value > 0).length;
  const totalHours = dailyHours.reduce((sumValue, entry) => sumValue + entry.value, 0);
  const recentLogs = logs.filter((log) => last7.includes(log.date));
  const averageFocus = recentLogs.length ? sum(recentLogs, "focusRating") / recentLogs.length : 0;
  const revisionsDone = recentLogs.filter((log) => log.revisionDone).length;
  const revisionRate = recentLogs.length ? revisionsDone / recentLogs.length : 0;
  const consistencyRate = Math.round((activeDays / 7) * 100);

  const productivityScore = Math.round(
    clamp((activeDays / 7) * 38, 0, 38) +
      clamp((totalHours / 28) * 34, 0, 34) +
      clamp((averageFocus / 10) * 18, 0, 18) +
      clamp(revisionRate * 10, 0, 10)
  );

  return {
    dailyHours,
    activeDays,
    consistencyRate,
    productivityScore
  };
}

function getStudyStreak(logs) {
  const activeDates = [...new Set(logs.filter((log) => log.studyHours > 0 || log.questionsSolved > 0 || log.lecturesCompleted > 0).map((log) => log.date))]
    .sort((a, b) => b.localeCompare(a));

  if (!activeDates.includes(getTodayStamp())) {
    return {
      days: 0,
      note: "No study session logged today yet. Add one to keep your streak alive."
    };
  }

  let streak = 0;
  let cursor = getTodayStamp();

  while (activeDates.includes(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }

  return {
    days: streak,
    note: streak >= 7 ? "Excellent streak. Protect it with a non-zero study day every day." : "Keep showing up daily. Even a short revision session protects momentum."
  };
}

function getWeakSubject(logs, tests) {
  const hasStudyData = logs.length > 0;
  const hasTestData = tests.length > 0;
  if (!hasStudyData && !hasTestData) {
    return null;
  }

  const subjectStats = SUBJECTS.map((subject) => {
    const subjectLogs = logs.filter((log) => log.subject === subject);
    const totalHours = sum(subjectLogs, "studyHours");
    const totalQuestions = sum(subjectLogs, "questionsSolved");
    const avgFocus = subjectLogs.length ? sum(subjectLogs, "focusRating") / subjectLogs.length : 0;
    const testPercentages = tests.map((test) => {
      const marks = subject === "Physics" ? test.physicsMarks : subject === "Chemistry" ? test.chemistryMarks : test.mathsMarks;
      return (marks / Math.max(test.maxMarks / 3, 1)) * 100;
    });
    const avgTest = testPercentages.length ? testPercentages.reduce((sumValue, value) => sumValue + value, 0) / testPercentages.length : 50;

    const composite = totalHours * 0.32 + totalQuestions * 0.02 + avgFocus * 3 + avgTest * 0.5;

    return {
      subject,
      composite
    };
  });

  const weakest = subjectStats.reduce((lowest, current) => (current.composite < lowest.composite ? current : lowest));
  return {
    subject: weakest.subject,
    note: `${weakest.subject} shows the weakest combined trend across study hours, focus, questions solved, and subject test scores.`
  };
}

function getLowConsistencyDays(logs) {
  const last14 = getLastDateStamps(14);
  const grouped = groupLogsByDate(logs);
  const lowDays = last14
    .map((date) => {
      const hours = grouped.get(date)?.reduce((sumValue, log) => sumValue + log.studyHours, 0) || 0;
      return { date, hours };
    })
    .filter((entry) => entry.hours > 0 && entry.hours < 2)
    .slice(0, 3);

  return {
    days: lowDays.map((entry) => formatters.shortMonth.format(parseDate(entry.date))),
    note: lowDays.length
      ? "These days had activity, but output stayed below 2 hours. Protect them with a fixed minimum study block."
      : ""
  };
}

function getSuggestedNextDayHours(logs, tests, backlog) {
  const recentLogs = logs.slice(0, 5);
  const recentAverage = recentLogs.length ? sum(recentLogs, "studyHours") / recentLogs.length : 2.5;
  const backlogBoost = Math.min(backlog.pendingQuestions / 60 + backlog.unfinishedLectures / 3 + backlog.missedHours / 2, 3.5);
  const recentTest = tests[0];
  const testAdjustment = recentTest && recentTest.percentage < 55 ? 1.2 : recentTest && recentTest.percentage > 75 ? -0.4 : 0;
  return roundTo(clamp(recentAverage + backlogBoost + testAdjustment, 1.5, 12), 1);
}

function getChapterProgress(logs) {
  const chapterMap = new Map();

  logs.forEach((log) => {
    const key = `${log.subject}::${log.chapter.toLowerCase()}`;
    const existing = chapterMap.get(key) || {
      subject: log.subject,
      chapter: log.chapter,
      plannedLectures: 0,
      lecturesCompleted: 0,
      plannedQuestions: 0,
      questionsSolved: 0,
      revisionHits: 0
    };

    existing.plannedLectures += log.plannedLectures;
    existing.lecturesCompleted += log.lecturesCompleted;
    existing.plannedQuestions += log.plannedQuestions;
    existing.questionsSolved += log.questionsSolved;
    existing.revisionHits += log.revisionDone ? 1 : 0;
    chapterMap.set(key, existing);
  });

  return [...chapterMap.values()]
    .map((row) => {
      const lectureRatio = row.plannedLectures > 0 ? row.lecturesCompleted / row.plannedLectures : row.lecturesCompleted > 0 ? 1 : 0;
      const questionRatio = row.plannedQuestions > 0 ? row.questionsSolved / row.plannedQuestions : row.questionsSolved > 0 ? 1 : 0;
      const revisionRatio = row.revisionHits > 0 ? 1 : 0;
      const percent = Math.round(clamp(lectureRatio * 60 + questionRatio * 25 + revisionRatio * 15, 0, 100));
      return {
        subject: row.subject,
        chapter: row.chapter,
        percent,
        note: `${row.lecturesCompleted}/${Math.max(row.plannedLectures, row.lecturesCompleted || 1)} lectures | ${row.questionsSolved}/${Math.max(row.plannedQuestions, row.questionsSolved || 1)} questions | ${row.revisionHits > 0 ? "Revision logged" : "Revision pending"}`
      };
    })
    .sort((a, b) => b.percent - a.percent);
}

function getSubjectQuestionTotals(logs) {
  return SUBJECTS.map((subject) => ({
    label: subject.slice(0, 4),
    value: logs.filter((log) => log.subject === subject).reduce((sumValue, log) => sumValue + log.questionsSolved, 0)
  }));
}

function getTestTrend(tests) {
  return [...tests]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-6)
    .map((test) => ({
      label: formatters.shortMonth.format(parseDate(test.date)),
      value: roundTo(test.percentage, 1)
    }));
}
function groupLogsByDate(logs) {
  const map = new Map();
  logs.forEach((log) => {
    const existing = map.get(log.date) || [];
    existing.push(log);
    map.set(log.date, existing);
  });
  return map;
}

function buildBacklogLine(log) {
  const pieces = [];
  const pendingLectures = Math.max(log.plannedLectures - log.lecturesCompleted, 0);
  const pendingQuestions = Math.max(log.plannedQuestions - log.questionsSolved, 0);
  const pendingHours = Math.max(log.targetHours - log.studyHours, 0);

  if (pendingLectures > 0) {
    pieces.push(`${pendingLectures} lecture backlog`);
  }

  if (pendingQuestions > 0) {
    pieces.push(`${pendingQuestions} question backlog`);
  }

  if (pendingHours > 0) {
    pieces.push(`${formatHours(pendingHours)} hrs short of target`);
  }

  return pieces.length ? pieces.join(" | ") : "Targets met for this entry.";
}

function createPill(text) {
  const pill = document.createElement("span");
  pill.className = "record-pill";
  pill.textContent = text;
  return pill;
}

function createEmptyState(message) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  return empty;
}

function clearChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function normalizeStudyLog(log) {
  const chapter = typeof log?.chapter === "string" ? log.chapter.trim() : "";
  const subject = SUBJECTS.includes(log?.subject) ? log.subject : "Physics";
  if (!chapter) {
    return null;
  }

  return {
    id: typeof log.id === "string" && log.id ? log.id : createId(),
    date: isValidDateStamp(log.date) ? log.date : getTodayStamp(),
    subject,
    chapter,
    plannedLectures: toInt(log.plannedLectures),
    lecturesCompleted: toInt(log.lecturesCompleted),
    plannedQuestions: toInt(log.plannedQuestions),
    questionsSolved: toInt(log.questionsSolved),
    targetHours: toFloat(log.targetHours),
    studyHours: toFloat(log.studyHours),
    revisionDone: Boolean(log.revisionDone),
    notes: typeof log.notes === "string" ? log.notes.trim().slice(0, 280) : "",
    focusRating: clamp(toInt(log.focusRating) || 1, 1, 10),
    createdAt: typeof log.createdAt === "string" ? log.createdAt : new Date().toISOString()
  };
}

function normalizeTest(test) {
  const name = typeof test?.name === "string" ? test.name.trim() : "";
  if (!name) {
    return null;
  }

  const maxMarks = Math.max(toInt(test.maxMarks), 1);
  const score = clamp(toInt(test.score), 0, maxMarks);
  const physicsMarks = clamp(toInt(test.physicsMarks), 0, maxMarks);
  const chemistryMarks = clamp(toInt(test.chemistryMarks), 0, maxMarks);
  const mathsMarks = clamp(toInt(test.mathsMarks), 0, maxMarks);

  return {
    id: typeof test.id === "string" && test.id ? test.id : createId(),
    name,
    date: isValidDateStamp(test.date) ? test.date : getTodayStamp(),
    score,
    maxMarks,
    physicsMarks,
    chemistryMarks,
    mathsMarks,
    percentage: (score / maxMarks) * 100,
    createdAt: typeof test.createdAt === "string" ? test.createdAt : new Date().toISOString()
  };
}

function createDemoData() {
  const today = getTodayStamp();
  const studyLogs = [
    {
      id: createId(),
      date: today,
      subject: "Physics",
      chapter: "Current Electricity",
      plannedLectures: 2,
      lecturesCompleted: 1,
      plannedQuestions: 45,
      questionsSolved: 32,
      targetHours: 5,
      studyHours: 4.5,
      revisionDone: true,
      notes: "Good conceptual clarity but still slow in mixed numericals.",
      focusRating: 8,
      createdAt: new Date().toISOString()
    },
    {
      id: createId(),
      date: today,
      subject: "Maths",
      chapter: "Definite Integration",
      plannedLectures: 1,
      lecturesCompleted: 1,
      plannedQuestions: 30,
      questionsSolved: 24,
      targetHours: 3,
      studyHours: 2.5,
      revisionDone: false,
      notes: "Need one more round of standard area questions.",
      focusRating: 7,
      createdAt: new Date().toISOString()
    },
    {
      id: createId(),
      date: shiftDate(today, -1),
      subject: "Chemistry",
      chapter: "Haloalkanes",
      plannedLectures: 2,
      lecturesCompleted: 2,
      plannedQuestions: 40,
      questionsSolved: 36,
      targetHours: 4,
      studyHours: 4,
      revisionDone: true,
      notes: "Reaction mechanism revision worked well.",
      focusRating: 8,
      createdAt: new Date().toISOString()
    },
    {
      id: createId(),
      date: shiftDate(today, -2),
      subject: "Physics",
      chapter: "Moving Charges and Magnetism",
      plannedLectures: 2,
      lecturesCompleted: 1,
      plannedQuestions: 35,
      questionsSolved: 18,
      targetHours: 4.5,
      studyHours: 3,
      revisionDone: false,
      notes: "Backlog building due to weak question conversion.",
      focusRating: 5,
      createdAt: new Date().toISOString()
    },
    {
      id: createId(),
      date: shiftDate(today, -3),
      subject: "Maths",
      chapter: "Probability",
      plannedLectures: 1,
      lecturesCompleted: 1,
      plannedQuestions: 30,
      questionsSolved: 27,
      targetHours: 3,
      studyHours: 3.5,
      revisionDone: true,
      notes: "Better pace after formula sheet revision.",
      focusRating: 8,
      createdAt: new Date().toISOString()
    },
    {
      id: createId(),
      date: shiftDate(today, -4),
      subject: "Chemistry",
      chapter: "Electrochemistry",
      plannedLectures: 2,
      lecturesCompleted: 1,
      plannedQuestions: 25,
      questionsSolved: 11,
      targetHours: 3.5,
      studyHours: 2,
      revisionDone: false,
      notes: "Conceptual learning done, question practice still pending.",
      focusRating: 6,
      createdAt: new Date().toISOString()
    },
    {
      id: createId(),
      date: shiftDate(today, -6),
      subject: "Maths",
      chapter: "Vectors 3D",
      plannedLectures: 1,
      lecturesCompleted: 1,
      plannedQuestions: 25,
      questionsSolved: 23,
      targetHours: 2.5,
      studyHours: 2.5,
      revisionDone: true,
      notes: "Clean completion day.",
      focusRating: 7,
      createdAt: new Date().toISOString()
    }
  ].map(normalizeStudyLog);

  const tests = [
    {
      id: createId(),
      name: "JEE Mock 01",
      date: shiftDate(today, -24),
      score: 142,
      maxMarks: 300,
      physicsMarks: 51,
      chemistryMarks: 58,
      mathsMarks: 33,
      createdAt: new Date().toISOString()
    },
    {
      id: createId(),
      name: "JEE Mock 02",
      date: shiftDate(today, -17),
      score: 156,
      maxMarks: 300,
      physicsMarks: 56,
      chemistryMarks: 61,
      mathsMarks: 39,
      createdAt: new Date().toISOString()
    },
    {
      id: createId(),
      name: "JEE Mock 03",
      date: shiftDate(today, -10),
      score: 171,
      maxMarks: 300,
      physicsMarks: 63,
      chemistryMarks: 64,
      mathsMarks: 44,
      createdAt: new Date().toISOString()
    },
    {
      id: createId(),
      name: "JEE Mock 04",
      date: shiftDate(today, -3),
      score: 182,
      maxMarks: 300,
      physicsMarks: 69,
      chemistryMarks: 67,
      mathsMarks: 46,
      createdAt: new Date().toISOString()
    }
  ].map(normalizeTest);

  return { studyLogs, tests };
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sum(items, key) {
  return items.reduce((sumValue, item) => sumValue + Number(item[key] || 0), 0);
}

function toInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function toFloat(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function roundTo(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatHours(value) {
  return roundTo(value, 1).toFixed(1);
}

function sortStudyLogs() {
  state.studyLogs.sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
}

function sortTests() {
  state.tests.sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
}

function getBacklogPressure(backlog) {
  const score = backlog.items.length + backlog.unfinishedLectures * 0.6 + backlog.pendingQuestions / 30 + backlog.missedHours * 0.8;
  if (score >= 8) {
    return "High";
  }

  if (score >= 4) {
    return "Medium";
  }

  return "Low";
}

function getTodayStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDate(dateStamp, deltaDays) {
  const date = parseDate(dateStamp);
  date.setDate(date.getDate() + deltaDays);
  return toDateStamp(date);
}

function getLastDateStamps(days) {
  return Array.from({ length: days }, (_, index) => shiftDate(getTodayStamp(), index - (days - 1)));
}

function parseDate(dateStamp) {
  return new Date(`${dateStamp}T00:00:00`);
}

function toDateStamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDateStamp(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}




