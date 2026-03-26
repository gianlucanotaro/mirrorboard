import "./style.css";
import { fetchUsers, type User } from "./api";
import { renderHabiticaWidget, refreshHabiticaWidget } from "./widgets/habitica";
import { renderCalendarWidget, refreshCalendarWidget } from "./widgets/calendar";
import { renderWeatherWidget, refreshWeatherWidget } from "./widgets/weather";

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

let refreshInterval: ReturnType<typeof setInterval> | null = null;

function renderDashboard(user: User) {
  if (refreshInterval !== null) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }

  const app = document.querySelector<HTMLDivElement>("#app")!;

  app.innerHTML = `
    <div class="h-full p-6 flex flex-col">
      <header class="mb-4 flex items-center gap-4 flex-shrink-0">
        <h1 class="text-3xl font-semibold text-primary" style="font-family:'Montserrat',sans-serif">
          MirrorBoard
        </h1>
        <span class="text-muted text-lg">— ${user.name}</span>
      </header>
      <main class="flex-1 min-h-0 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div id="widget-calendar" class="bg-surface rounded-2xl p-5 border border-border flex flex-col min-h-0"></div>
        <div id="widget-weather" class="bg-surface rounded-2xl p-5 border border-border overflow-y-auto"></div>
        <div id="widget-habitica" class="bg-surface rounded-2xl p-5 border border-border overflow-y-auto"></div>
      </main>
    </div>
  `;

  renderCalendarWidget(app.querySelector<HTMLDivElement>("#widget-calendar")!, user.id);
  renderWeatherWidget(app.querySelector<HTMLDivElement>("#widget-weather")!);
  renderHabiticaWidget(app.querySelector<HTMLDivElement>("#widget-habitica")!, user.id);

  refreshInterval = setInterval(() => {
    const calEl = document.querySelector<HTMLDivElement>("#widget-calendar");
    const wthEl = document.querySelector<HTMLDivElement>("#widget-weather");
    const habEl = document.querySelector<HTMLDivElement>("#widget-habitica");
    if (calEl) refreshCalendarWidget(calEl, user.id);
    if (wthEl) refreshWeatherWidget(wthEl);
    if (habEl) refreshHabiticaWidget(habEl, user.id);
  }, 10_000);
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
