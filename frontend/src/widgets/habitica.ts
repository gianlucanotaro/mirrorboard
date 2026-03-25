import { fetchHabiticaTasks, type Habit, type Daily, type Todo } from "../api";

export async function renderHabiticaWidget(
  container: HTMLElement,
  userId: string
) {
  container.innerHTML = `
    <h2 class="text-lg font-semibold mb-3 text-text" style="font-family:'Montserrat',sans-serif">Habitica</h2>
    <p class="text-sm text-muted">Loading...</p>
  `;

  let tasks;
  try {
    tasks = await fetchHabiticaTasks(userId);
  } catch {
    container.querySelector("p")!.textContent = "Failed to load tasks.";
    return;
  }

  container.innerHTML = `
    <h2 class="text-lg font-semibold mb-4 text-text" style="font-family:'Montserrat',sans-serif">
      Habitica
    </h2>
    <div class="flex flex-col gap-5">
      ${renderSection("Habits", habitsHtml(tasks.habits))}
      ${renderSection("Dailies", dailiesHtml(tasks.dailies))}
      ${renderSection("Tasks", todosHtml(tasks.todos))}
    </div>
  `;
}

function renderSection(title: string, content: string): string {
  return `
    <div>
      <p class="text-xs font-semibold uppercase tracking-widest text-muted mb-2"
         style="font-family:'Montserrat',sans-serif">${title}</p>
      <ul class="flex flex-col">${content}</ul>
    </div>
  `;
}

function habitsHtml(habits: Habit[]): string {
  if (habits.length === 0) return emptyItem();
  return habits.map((h) => `
    <li class="flex items-center gap-3 py-2 border-b border-border last:border-0">
      <span class="flex gap-1 flex-shrink-0">
        ${h.up ? `<span class="text-primary text-xs font-bold leading-none">▲${h.counterUp}</span>` : ""}
        ${h.down ? `<span class="text-muted text-xs font-bold leading-none">▼${h.counterDown}</span>` : ""}
      </span>
      <span class="text-sm text-text leading-snug">${escapeHtml(h.text)}</span>
    </li>`
  ).join("");
}

function dailiesHtml(dailies: Daily[]): string {
  if (dailies.length === 0) return emptyItem();
  return dailies.map((d) => `
    <li class="flex items-start gap-3 py-2 border-b border-border last:border-0">
      <span class="mt-0.5 w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center
        ${d.completed ? "bg-primary border-primary" : d.isDue ? "border-primary" : "border-muted"}">
        ${d.completed ? checkSvg() : ""}
      </span>
      <span class="flex-1 text-sm leading-snug ${d.completed ? "line-through text-muted" : d.isDue ? "text-text" : "text-muted"}">
        ${escapeHtml(d.text)}
        ${d.streak > 0 ? `<span class="ml-1 text-xs text-muted">🔥${d.streak}</span>` : ""}
      </span>
    </li>`
  ).join("");
}

function todosHtml(todos: Todo[]): string {
  if (todos.length === 0) return emptyItem();
  return todos.map((t) => `
    <li class="flex items-start gap-3 py-2 border-b border-border last:border-0">
      <span class="mt-0.5 w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center
        ${t.completed ? "bg-primary border-primary" : "border-primary"}">
        ${t.completed ? checkSvg() : ""}
      </span>
      <span class="text-sm leading-snug ${t.completed ? "line-through text-muted" : "text-text"}">
        ${escapeHtml(t.text)}
      </span>
    </li>`
  ).join("");
}

function checkSvg(): string {
  return `<svg class="w-3 h-3 text-primary-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
  </svg>`;
}

function emptyItem(): string {
  return `<li class="text-sm text-muted py-1">Nothing here.</li>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
