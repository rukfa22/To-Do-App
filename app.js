const STORAGE_KEY = "daymark-tasks";

const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const taskCount = document.querySelector("#task-count");
const emptyState = document.querySelector("#empty-state");
const clearCompletedButton = document.querySelector("#clear-completed");
const filterButtons = document.querySelectorAll("[data-filter]");

let tasks = loadTasks();
let currentFilter = "all";

document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
}).format(new Date());

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(savedTasks)
      ? savedTasks.filter((task) => task && typeof task.id === "string" && typeof task.text === "string" && typeof task.completed === "boolean")
      : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    taskCount.textContent = "Unable to save tasks on this device";
  }
}

function renderTasks() {
  const visibleTasks = tasks.filter((task) => {
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });
  const remainingCount = tasks.filter((task) => !task.completed).length;

  taskCount.textContent = `${remainingCount} ${remainingCount === 1 ? "task" : "tasks"} left`;
  taskList.replaceChildren(...visibleTasks.map(createTaskElement));
  emptyState.classList.toggle("is-visible", visibleTasks.length === 0);
  emptyState.querySelector(".empty-title").textContent = tasks.length === 0 ? "A clear start." : "Nothing here.";
  emptyState.querySelector(".empty-copy").textContent = tasks.length === 0
    ? "Add a task above and make today yours."
    : "Try another filter or add a new task.";
  clearCompletedButton.hidden = !tasks.some((task) => task.completed);
}

function createTaskElement(task) {
  const item = document.createElement("li");
  item.className = `task-item${task.completed ? " is-completed" : ""}`;

  const checkButton = document.createElement("button");
  checkButton.className = "task-check";
  checkButton.type = "button";
  checkButton.setAttribute("aria-label", `${task.completed ? "Mark as active" : "Mark as completed"}: ${task.text}`);
  checkButton.setAttribute("aria-pressed", String(task.completed));
  checkButton.addEventListener("click", () => toggleTask(task.id));

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", `Delete task: ${task.text}`);
  deleteButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" /></svg>';
  deleteButton.addEventListener("click", () => deleteTask(task.id));

  item.append(checkButton, text, deleteButton);
  return item;
}

function addTask(text) {
  const trimmedText = text.trim();
  if (!trimmedText) return;

  tasks.unshift({ id: crypto.randomUUID(), text: trimmedText, completed: false });
  saveTasks();
  renderTasks();
}

function toggleTask(taskId) {
  tasks = tasks.map((task) => task.id === taskId ? { ...task, completed: !task.completed } : task);
  saveTasks();
  renderTasks();
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderTasks();
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask(taskInput.value);
  taskInput.value = "";
  taskInput.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle("is-active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });
    renderTasks();
  });
});

clearCompletedButton.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
});

renderTasks();