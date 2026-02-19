"use strict";
// Theme toggle
(function () {
    const checkbox = document.getElementById("theme-checkbox");
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
    checkbox.checked = theme === "dark";
    checkbox.addEventListener("change", function () {
        const next = checkbox.checked ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("theme", next);
    });
})();
// Draggable resizer
(function () {
    const resizer = document.getElementById("resizer");
    const sidebar = document.getElementById("important-events");
    const savedWidth = localStorage.getItem("sidebarWidth");
    if (savedWidth) {
        sidebar.style.width = savedWidth + "px";
    }
    let startX = 0;
    let startWidth = 0;
    function onMouseMove(e) {
        const delta = startX - e.clientX;
        const newWidth = Math.max(150, Math.min(600, startWidth + delta));
        sidebar.style.width = newWidth + "px";
    }
    function onMouseUp() {
        resizer.classList.remove("dragging");
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        localStorage.setItem("sidebarWidth", String(sidebar.offsetWidth));
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    }
    resizer.addEventListener("mousedown", function (e) {
        e.preventDefault();
        startX = e.clientX;
        startWidth = sidebar.offsetWidth;
        resizer.classList.add("dragging");
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    });
})();
document.addEventListener("DOMContentLoaded", function () {
    const calendarEl = document.getElementById("calendar");
    const importantEl = document.getElementById("important-list");
    let calendar = null;
    const backendUrl = "/events";
    async function loadEvents() {
        const res = await fetch(backendUrl);
        const data = await res.json();
        if (data.error) {
            window.location.href = "/login";
            return;
        }
        const events = data.regular.map((event) => ({
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
        }
        else {
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
