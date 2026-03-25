import "./style.css";
import { fetchUsers, type User } from "./api";
import { renderHabiticaWidget } from "./widgets/habitica";

function renderUserSelect(users: User[]) {
  const app = document.querySelector<HTMLDivElement>("#app")!;

  app.innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-center gap-8 px-8">
      <h1 class="text-4xl font-semibold tracking-wide" style="color:#2d5016; font-family:'Montserrat',sans-serif">
        Who are you?
      </h1>
      <div id="user-list" class="flex flex-col gap-5 w-full max-w-sm"></div>
    </div>
  `;

  const list = app.querySelector<HTMLDivElement>("#user-list")!;

  if (users.length === 0) {
    list.innerHTML = `<p class="text-center text-gray-400">No users found.</p>`;
    return;
  }

  for (const user of users) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = user.name;
    btn.className = [
      "w-full py-8 rounded-2xl",
      "text-2xl font-semibold tracking-wide",
      "bg-white/70 border border-[#e8e2d9]",
      "text-[#2d5016]",
      "shadow-sm",
      "transition-all duration-200",
      "active:scale-95 active:bg-[#2d5016] active:text-[#f5f0e8]",
      "hover:bg-[#2d5016] hover:text-[#f5f0e8]",
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
        <h1 class="text-3xl font-semibold" style="color:#2d5016; font-family:'Montserrat',sans-serif">
          MirrorBoard
        </h1>
        <span class="text-gray-400 text-lg">— ${user.name}</span>
      </header>
      <main class="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div class="bg-white/60 rounded-2xl p-5 shadow-sm border border-[#e8e2d9]">
          <h2 class="text-lg font-semibold mb-2" style="font-family:'Montserrat',sans-serif">Calendar</h2>
          <p class="text-sm text-gray-400">Coming soon</p>
        </div>
        <div class="bg-white/60 rounded-2xl p-5 shadow-sm border border-[#e8e2d9]">
          <h2 class="text-lg font-semibold mb-2" style="font-family:'Montserrat',sans-serif">To-Do</h2>
          <p class="text-sm text-gray-400">Coming soon</p>
        </div>
        <div id="widget-habitica" class="bg-white/60 rounded-2xl p-5 shadow-sm border border-[#e8e2d9]"></div>
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
