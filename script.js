const today = new Date();
today.setHours(0, 0, 0, 0);

const dayOffset = (amount) => {
  const date = new Date(today);
  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
};

const initialTasks = [
  { id: 1, title: "Finish chapter 6 problem set", course: "Calculus II", due: dayOffset(0), priority: "high", completed: false, note: "12 questions · Est. 45 min" },
  { id: 2, title: "Read research paper on memory", course: "Psychology", due: dayOffset(0), priority: "normal", completed: false, note: "Pages 8–24 · Add 3 notes" },
  { id: 3, title: "Outline essay: The Great Gatsby", course: "English Lit", due: dayOffset(1), priority: "high", completed: false, note: "Draft thesis + 3 sections" },
  { id: 4, title: "Review lecture slides", course: "Organic Chemistry", due: dayOffset(2), priority: "low", completed: false, note: "Week 8 · Reactions" },
  { id: 5, title: "Submit lab report", course: "Physics", due: dayOffset(3), priority: "high", completed: false, note: "Lab 04 · Include calculations" },
  { id: 6, title: "Flashcards: French verbs", course: "French II", due: dayOffset(-1), priority: "normal", completed: true, note: "Unit 5 · 20 cards" },
];

const storageKey = "study-desk-tasks-v1";
let tasks = loadTasks();
let activeFilter = "all";
let toastTimer;

const elements = {
  list: document.querySelector("#task-list"),
  dialog: document.querySelector("#task-dialog"),
  form: document.querySelector("#task-form"),
  title: document.querySelector("#task-title"),
  course: document.querySelector("#task-course"),
  due: document.querySelector("#task-due"),
  priority: document.querySelector("#task-priority"),
  search: document.querySelector("#task-search"),
  sort: document.querySelector("#sort-select"),
  toast: document.querySelector("#toast"),
};

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return Array.isArray(saved) ? saved : initialTasks;
  } catch {
    return initialTasks;
  }
}

function saveTasks() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function dateAtMidnight(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDue(dateString) {
  const date = dateAtMidnight(dateString);
  const delta = Math.round((date - today) / 86400000);
  if (delta === 0) return "Today";
  if (delta === 1) return "Tomorrow";
  if (delta === -1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dateLabel(date) {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
}

function shortDate(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

function taskMatchesFilter(task) {
  const delta = Math.round((dateAtMidnight(task.due) - today) / 86400000);
  if (activeFilter === "today") return !task.completed && delta <= 0;
  if (activeFilter === "upcoming") return !task.completed && delta > 0;
  if (activeFilter === "done") return task.completed;
  return true;
}

function visibleTasks() {
  const query = elements.search.value.trim().toLowerCase();
  return tasks
    .filter(taskMatchesFilter)
    .filter((task) => `${task.title} ${task.course} ${task.note}`.toLowerCase().includes(query))
    .sort((first, second) => {
      if (elements.sort.value === "priority") {
        const rank = { high: 0, normal: 1, low: 2 };
        return rank[first.priority] - rank[second.priority] || first.due.localeCompare(second.due);
      }
      if (elements.sort.value === "course") return first.course.localeCompare(second.course);
      return first.due.localeCompare(second.due);
    });
}

function courseInitial(course) {
  return course.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "—";
}

function renderTask(task) {
  const row = document.createElement("article");
  const dueDelta = Math.round((dateAtMidnight(task.due) - today) / 86400000);
  row.className = `task-row${task.completed ? " completed" : ""}`;
  row.dataset.taskId = task.id;

  const check = document.createElement("button");
  check.className = "task-check";
  check.type = "button";
  check.setAttribute("aria-label", task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`);
  check.setAttribute("aria-pressed", String(task.completed));
  check.innerHTML = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="m2 6 2.5 2.5L10 3"/></svg>';

  const copy = document.createElement("div");
  copy.className = "task-copy";
  const title = document.createElement("p");
  title.className = "task-title";
  title.textContent = task.title;
  const note = document.createElement("p");
  note.className = "task-subtitle";
  note.textContent = task.note || "No extra details";
  copy.append(title, note);

  const course = document.createElement("div");
  course.className = "task-course";
  const mark = document.createElement("span");
  mark.className = "course-mark";
  mark.textContent = courseInitial(task.course);
  const courseName = document.createElement("span");
  courseName.textContent = task.course || "Personal";
  course.append(mark, courseName);

  const due = document.createElement("span");
  due.className = `task-due${dueDelta < 0 && !task.completed ? " overdue" : ""}`;
  due.textContent = task.completed ? "Done" : formatDue(task.due);

  const priority = document.createElement("span");
  priority.className = `priority ${task.priority}`;
  priority.textContent = task.priority === "normal" ? "Normal" : task.priority[0].toUpperCase() + task.priority.slice(1);

  const more = document.createElement("button");
  more.className = "task-more";
  more.type = "button";
  more.setAttribute("aria-label", `Delete ${task.title}`);
  more.title = "Delete task";
  more.textContent = "×";

  row.append(check, copy, course, due, priority, more);
  return row;
}

function renderList() {
  const filtered = visibleTasks();
  elements.list.replaceChildren();
  if (filtered.length) {
    filtered.forEach((task) => elements.list.append(renderTask(task)));
  } else {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const symbol = document.createElement("span");
    symbol.className = "empty-symbol";
    symbol.textContent = activeFilter === "done" ? "✓" : "＋";
    const heading = document.createElement("strong");
    heading.textContent = elements.search.value ? "No matching tasks" : activeFilter === "done" ? "Nothing completed yet" : "A little breathing room";
    const text = document.createElement("p");
    text.textContent = elements.search.value ? "Try a different search." : activeFilter === "done" ? "Completed tasks will show up here." : "Add a task when you are ready.";
    empty.append(symbol, heading, text);
    elements.list.append(empty);
  }
  const summary = activeFilter === "all" ? "Showing all tasks" : `Showing ${document.querySelector(`[data-filter="${activeFilter}"]`).firstChild.textContent.trim().toLowerCase()} tasks`;
  document.querySelector("#list-summary").textContent = `${summary} · ${filtered.length} shown`;
}

function renderStats() {
  const all = tasks.length;
  const done = tasks.filter((task) => task.completed).length;
  const todayCount = tasks.filter((task) => !task.completed && dateAtMidnight(task.due) <= today).length;
  const upcomingCount = tasks.filter((task) => !task.completed && dateAtMidnight(task.due) > today).length;
  const percent = all ? Math.round((done / all) * 100) : 0;
  document.querySelector("#task-total").textContent = all;
  document.querySelector("#count-all").textContent = all;
  document.querySelector("#count-today").textContent = todayCount;
  document.querySelector("#count-upcoming").textContent = upcomingCount;
  document.querySelector("#count-done").textContent = done;
  document.querySelector("#progress-number").innerHTML = `${percent}<span>%</span>`;
  document.querySelector("#progress-count").textContent = `${done} / ${all}`;
  document.querySelector("#progress-caption").textContent = "of weekly tasks complete";
  document.querySelector("#progress-ring").style.background = `conic-gradient(var(--black) ${percent}%, #e8e8e4 ${percent}%)`;
  document.querySelector("#progress-ring").setAttribute("aria-label", `${percent} percent of weekly tasks complete`);
  document.querySelector("#progress-bar").style.width = `${percent}%`;

  const nextTask = tasks.filter((task) => !task.completed).sort((a, b) => a.due.localeCompare(b.due))[0];
  const nextContent = document.querySelector("#up-next-content");
  nextContent.replaceChildren();
  if (nextTask) {
    const title = document.createElement("strong");
    title.className = "up-next-title";
    title.textContent = nextTask.title;
    const meta = document.createElement("div");
    meta.className = "up-next-meta";
    meta.innerHTML = `<span></span><span class="meta-divider">·</span><span></span>`;
    meta.children[0].textContent = nextTask.course || "Personal";
    meta.children[2].textContent = formatDue(nextTask.due);
    nextContent.append(title, meta);
    document.querySelector("#up-next-footer").textContent = nextTask.priority === "high" ? "A priority worth your focus" : "Keep your momentum going";
  } else {
    const title = document.createElement("strong");
    title.className = "up-next-title";
    title.textContent = "All caught up";
    const meta = document.createElement("div");
    meta.className = "up-next-meta";
    meta.textContent = "Nothing waiting in your plan";
    nextContent.append(title, meta);
    document.querySelector("#up-next-footer").textContent = "Enjoy the breathing room";
  }
}

function renderWeek() {
  const monday = new Date(today);
  const weekday = (today.getDay() + 6) % 7;
  monday.setDate(today.getDate() - weekday);
  const days = document.querySelector("#mini-days");
  days.replaceChildren();
  "MTWTFSS".split("").forEach((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const item = document.createElement("span");
    item.className = `mini-day${date.getTime() === today.getTime() ? " today" : ""}`;
    const dayLabel = document.createElement("span");
    dayLabel.textContent = label;
    const number = document.createElement("b");
    number.textContent = date.getDate();
    item.append(dayLabel, number);
    days.append(item);
  });
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  const monthNames = [monday, sunday].map((date) => date.toLocaleDateString("en-US", { month: "long" }).toUpperCase());
  const thursday = new Date(monday);
  thursday.setDate(monday.getDate() + 3);
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  firstThursday.setDate(firstThursday.getDate() + ((4 - firstThursday.getDay() + 7) % 7));
  const weekNumber = 1 + Math.round((thursday - firstThursday) / (7 * 86400000));
  document.querySelector("#week-month").textContent = [...new Set(monthNames)].join(" / ");
  document.querySelector("#week-number").textContent = `W${weekNumber}`;
  document.querySelector("#week-range").textContent = `${shortDate(monday)} — ${shortDate(sunday)}`;
}

function render() {
  renderStats();
  renderList();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove("visible"), 2200);
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll(".filter-tab").forEach((button) => {
    const selected = button.dataset.filter === filter;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-selected", String(selected));
  });
  renderList();
}

function openDialog() {
  elements.due.value = dayOffset(0);
  elements.dialog.showModal();
  requestAnimationFrame(() => elements.title.focus());
}

document.querySelector("#today-date").textContent = today.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase();
document.querySelector("#greeting-date").textContent = dateLabel(today);
document.querySelector("#footer-year").textContent = today.getFullYear();
renderWeek();
render();

document.querySelector("#add-task-button").addEventListener("click", openDialog);
document.querySelector("#dialog-close").addEventListener("click", () => elements.dialog.close());
document.querySelector("#cancel-task").addEventListener("click", () => elements.dialog.close());
document.querySelectorAll(".filter-tab").forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.filter)));
elements.search.addEventListener("input", renderList);
elements.sort.addEventListener("change", renderList);

document.querySelector("#search-toggle").addEventListener("click", () => {
  elements.search.focus();
  document.querySelector("#search-field").scrollIntoView({ behavior: "smooth", block: "center" });
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    elements.search.focus();
  }
  if (event.key === "Escape" && elements.dialog.open) elements.dialog.close();
});

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = elements.title.value.trim();
  if (!title) return;
  tasks.unshift({
    id: Date.now(),
    title,
    course: elements.course.value.trim() || "Personal",
    due: elements.due.value,
    priority: elements.priority.value,
    completed: false,
    note: "Added just now",
  });
  saveTasks();
  elements.form.reset();
  elements.dialog.close();
  setFilter("all");
  render();
  showToast("Task added to your plan");
});

elements.list.addEventListener("click", (event) => {
  const row = event.target.closest(".task-row");
  if (!row) return;
  const taskId = Number(row.dataset.taskId);
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;
  if (event.target.closest(".task-check")) {
    task.completed = !task.completed;
    saveTasks();
    render();
    showToast(task.completed ? "Nice work. Task completed." : "Task moved back to your plan");
  }
  if (event.target.closest(".task-more")) {
    tasks = tasks.filter((item) => item.id !== taskId);
    saveTasks();
    render();
    showToast("Task removed");
  }
});

elements.dialog.addEventListener("click", (event) => {
  if (event.target === elements.dialog) elements.dialog.close();
});