document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  const importantEl = document.getElementById("important-list");
  let calendar;

  const backendUrl = "/events";

  async function loadEvents() {
    const res = await fetch(backendUrl);
    const data = await res.json();

    const events = data.regular.map((event) => ({
      title: event.summary || "(No Title)",
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
    }));

    // Calculate 4-week range: 1 week before today, 2 weeks after
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay() - 7); // Previous Sunday
    const end = new Date(start);
    end.setDate(start.getDate() + 28); // 4 full weeks

    if (calendar) {
      calendar.removeAllEvents();
      calendar.addEventSource(events);
    } else {
      calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth", // Required for visibleRange to work correctly
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
        height: "80vh",
        fixedWeekCount: false,
      });

      calendar.render();
    }

    // Update important events
    importantEl.innerHTML = "";
    data.important.forEach((event) => {
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
