declare namespace FullCalendar {
  class Calendar {
    constructor(el: HTMLElement, options: Record<string, unknown>);
    render(): void;
    removeAllEvents(): void;
    addEventSource(events: CalendarEvent[]): void;
  }
}

interface CalendarEvent {
  title: string;
  start: string | undefined;
  end: string | undefined;
}

interface GoogleDateTime {
  dateTime?: string;
  date?: string;
}

interface GoogleEvent {
  summary?: string;
  start?: GoogleDateTime;
  end?: GoogleDateTime;
}

interface EventsResponse {
  error?: string;
  regular: GoogleEvent[];
  important: GoogleEvent[];
}

// Theme toggle
(function (): void {
  const toggle = document.getElementById("theme-toggle") as HTMLButtonElement;
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");

  document.documentElement.setAttribute("data-theme", theme);
  toggle.textContent = theme === "dark" ? "\u2600" : "\u263E";

  toggle.addEventListener("click", function (): void {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    toggle.textContent = next === "dark" ? "\u2600" : "\u263E";
    localStorage.setItem("theme", next);
  });
})();

document.addEventListener("DOMContentLoaded", function (): void {
  const calendarEl = document.getElementById("calendar") as HTMLElement;
  const importantEl = document.getElementById("important-list") as HTMLElement;
  let calendar: FullCalendar.Calendar | null = null;

  const backendUrl = "/events";

  async function loadEvents(): Promise<void> {
    const res = await fetch(backendUrl);
    const data: EventsResponse = await res.json();

    if (data.error) {
      window.location.href = "/login";
      return;
    }

    const events: CalendarEvent[] = data.regular.map((event: GoogleEvent) => ({
      title: event.summary || "(No Title)",
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
    }));

    // 4-week range starting from Sunday of the current week
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay()); // Sunday of current week
    const end = new Date(start);
    end.setDate(start.getDate() + 28); // 4 full weeks

    if (calendar) {
      calendar.removeAllEvents();
      calendar.addEventSource(events);
    } else {
      calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGrid",
        visibleRange: {
          start: start.toISOString().split("T")[0],
          end: end.toISOString().split("T")[0],
        },
        firstDay: 0, // Sunday
        headerToolbar: {
          left: "",
          center: "title",
          right: "",
        },
        events: events,
        height: "100%",
        fixedWeekCount: false,
      });

      calendar.render();
    }

    // Update important events
    importantEl.innerHTML = "";
    data.important.forEach((event: GoogleEvent) => {
      const div = document.createElement("div");
      const date = event.start?.dateTime || event.start?.date || "";
      div.className = "important-event";
      div.textContent = `${event.summary} – ${new Date(date).toLocaleString()}`;
      importantEl.appendChild(div);
    });
  }

  loadEvents(); // Initial load
  setInterval(loadEvents, 10000); // Refresh every 10 seconds
});
