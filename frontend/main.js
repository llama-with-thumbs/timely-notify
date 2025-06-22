document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  const importantEl = document.getElementById("important-list");
  let calendar;

  async function loadEvents() {
    try {
      const res = await fetch("https://timely-notify.onrender.com/events");
      const data = await res.json();

      const events = data.regular.map((event) => ({
        title: event.summary || "(No Title)",
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
      }));

      if (calendar) {
        calendar.removeAllEvents();
        calendar.addEventSource(events);
      } else {
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - 7);
        const end = new Date(today);
        end.setDate(today.getDate() + 21);

        calendar = new FullCalendar.Calendar(calendarEl, {
          initialView: 'dayGridMonth',
          visibleRange: {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
          },
          firstDay: 0, // Sunday
          headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          },
          events: events,
          height: 'auto',
          fixedWeekCount: false,
        });

        calendar.render();
      }

      // Display important events
      importantEl.innerHTML = "";
      data.important.forEach((event) => {
        const div = document.createElement("div");
        const date = event.start?.dateTime || event.start?.date || "";
        div.className = "important-event";
        div.textContent = `${event.summary} – ${new Date(date).toLocaleString()}`;
        importantEl.appendChild(div);
      });

    } catch (error) {
      console.error("Failed to load events:", error);
    }
  }

  loadEvents();
  setInterval(loadEvents, 10000); // Refresh every 10 seconds
});
