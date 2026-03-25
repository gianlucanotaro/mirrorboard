import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="min-h-screen p-6">
    <header class="mb-8">
      <h1 class="text-3xl font-semibold text-[#2d5016]">MirrorBoard</h1>
    </header>
    <main class="grid grid-cols-2 gap-4 md:grid-cols-3">
      <div class="bg-white/60 rounded-2xl p-5 shadow-sm border border-[#e8e2d9]">
        <h2 class="text-lg font-semibold mb-2">Calendar</h2>
        <p class="text-sm text-gray-500">Coming soon</p>
      </div>
      <div class="bg-white/60 rounded-2xl p-5 shadow-sm border border-[#e8e2d9]">
        <h2 class="text-lg font-semibold mb-2">To-Do</h2>
        <p class="text-sm text-gray-500">Coming soon</p>
      </div>
      <div class="bg-white/60 rounded-2xl p-5 shadow-sm border border-[#e8e2d9]">
        <h2 class="text-lg font-semibold mb-2">Habitica</h2>
        <p class="text-sm text-gray-500">Coming soon</p>
      </div>
    </main>
  </div>
`;
