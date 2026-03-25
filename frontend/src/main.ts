import "./style.css";
import { fetchUsers, type User } from "./api";
import { renderHabiticaWidget } from "./widgets/habitica";

function renderUserSelect(users: User[]) {
  const app = document.querySelector<HTMLDivElement>("#app")!;

  app.innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-center gap-8 px-8">
      <h1 class="text-4xl font-semibold tracking-wide text-primary" style="font-family:'Montserrat',sans-serif">
        Who are you?
      </h1>
      <div id="user-list" class="flex flex-col gap-5 w-full max-w-sm"></div>
    </div>
  `;

  const list = app.querySelector<HTMLDivElement>("#user-list")!;

  if (users.length === 0) {
    list.innerHTML = `<p class="text-center text-muted">No users found.</p>`;
    return;
  }

  for (const user of users) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = user.name;
    btn.className = [
      "w-full py-8 rounded-2xl",
      "text-2xl font-semibold tracking-wide",
      "bg-surface border border-border",
      "text-text",
      "transition-all duration-200",
      "hover:bg-primary hover:text-primary-fg hover:border-primary",
      "active:scale-95",
      "cursor-pointer select-none",
    ].join(" ");
    btn.style.fontFamily = "'Montserrat', sans-serif";
    btn.addEventListener("click", () => renderDashboard(user));
    list.appendChild(btn);
  }
}

function renderDashboard(user: User) {
  const app = document.querySelector<HTMLDivElement>("#app")!;

  app.innerHTML = `
    <div class="min-h-screen p-6">
      <header class="mb-8 flex items-center gap-4">
        <h1 class="text-3xl font-semibold text-primary" style="font-family:'Montserrat',sans-serif">
          MirrorBoard
        </h1>
        <span class="text-muted text-lg">— ${user.name}</span>
      </header>
      <main class="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div class="bg-surface rounded-2xl p-5 border border-border">
          <h2 class="text-lg font-semibold mb-2 text-text" style="font-family:'Montserrat',sans-serif">Calendar</h2>
          <p class="text-sm text-muted">Coming soon</p>
        </div>
        <div class="bg-surface rounded-2xl p-5 border border-border">
          <h2 class="text-lg font-semibold mb-2 text-text" style="font-family:'Montserrat',sans-serif">To-Do</h2>
          <p class="text-sm text-muted">Coming soon</p>
        </div>
        <div id="widget-habitica" class="bg-surface rounded-2xl p-5 border border-border"></div>
      </main>
    </div>
  `;

  const habiticaEl = app.querySelector<HTMLDivElement>("#widget-habitica")!;
  renderHabiticaWidget(habiticaEl, user.id);
}

async function init() {
  try {
    const users = await fetchUsers();
    renderUserSelect(users);
  } catch {
    document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
      <div class="min-h-screen flex items-center justify-center">
        <p class="text-red-400">Could not connect to backend. Is it running?</p>
      </div>
    `;
  }
}

init();
