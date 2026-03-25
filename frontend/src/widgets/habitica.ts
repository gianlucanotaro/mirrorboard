import { fetchHabiticaTodos, type Todo } from "../api";

export async function renderHabiticaWidget(
  container: HTMLElement,
  userId: string
) {
  container.innerHTML = `
    <h2 class="text-lg font-semibold mb-3 text-text" style="font-family:'Montserrat',sans-serif">Habitica</h2>
    <p class="text-sm text-muted">Loading...</p>
  `;

  let todos: Todo[];
  try {
    todos = await fetchHabiticaTodos(userId);
  } catch {
    container.querySelector("p")!.textContent = "Failed to load todos.";
    return;
  }

  const pending = todos.filter((t) => !t.completed);

  container.innerHTML = `
    <h2 class="text-lg font-semibold mb-3 text-text" style="font-family:'Montserrat',sans-serif">
      Habitica
      <span class="ml-2 text-sm font-normal text-muted">${pending.length} open</span>
    </h2>
    <ul class="flex flex-col gap-2">
      ${
        todos.length === 0
          ? `<li class="text-sm text-muted">No todos.</li>`
          : todos
              .map(
                (t) => `
        <li class="flex items-start gap-3 py-2 border-b border-border last:border-0">
          <span class="mt-0.5 w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center
            ${t.completed ? "bg-primary border-primary" : "border-primary"}">
            ${t.completed ? `<svg class="w-3 h-3 text-primary-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>` : ""}
          </span>
          <span class="text-sm leading-snug ${t.completed ? "line-through text-muted" : "text-text"}">
            ${escapeHtml(t.text)}
          </span>
        </li>`
              )
              .join("")
      }
    </ul>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
