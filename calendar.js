// =====================
// js/calendar.js
// Calendrier des salles
// =====================

document.addEventListener("DOMContentLoaded", () => {
  requireAuth();
  requirePerm("VIEW_CALENDAR");

  const dow = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const dowEl = document.getElementById("dow");
  const gridEl = document.getElementById("grid");
  const titleEl = document.getElementById("title");

  const panel = document.getElementById("dayPanel");
  const panelTitle = document.getElementById("panelTitle");
  const slotsEl = document.getElementById("slots");
  const roomFilter = document.getElementById("roomFilter");

  let current = new Date();
  current.setDate(1);
  let selectedDayStr = null;

  if (dowEl) {
    dowEl.innerHTML = dow.map((d) => `<div class="dow">${d}</div>`).join("");
  }

  function ymd(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function monthTitle(date) {
    return date.toLocaleDateString("fr-CA", {
      month: "long",
      year: "numeric",
    });
  }

  function timeHM(dt) {
    const t = (dt || "").split("T")[1] || "";
    return t.slice(0, 5);
  }

  function sameDay(dt, dayStr) {
    return (dt || "").startsWith(dayStr);
  }

  function overlaps(aStart, aEnd, bStart, bEnd) {
    if (!aStart || !aEnd || !bStart || !bEnd) return false;
    return aStart < bEnd && bStart < aEnd;
  }

  function getBookingStart(item) {
    return item.start || item.start_datetime || "";
  }

  function getBookingEnd(item) {
    return item.end || item.end_datetime || "";
  }

  function getBookingRoom(item) {
    return item.room || item.room_requested || "";
  }

  function getAllBookings() {
    const events = getEvents().map((e) => ({
      kind: "event",
      room: getBookingRoom(e),
      title: e.title || "Événement",
      start: getBookingStart(e),
      end: getBookingEnd(e),
    }));

    const reservations = getReservations().map((r) => ({
      kind: "reservation",
      room: getBookingRoom(r),
      title: r.title || "Réservation",
      start: getBookingStart(r),
      end: getBookingEnd(r),
    }));

    return [...events, ...reservations];
  }

  function bookingsForDay(dayStr) {
    return getAllBookings().filter((b) => sameDay(b.start, dayStr));
  }

  function renderMonth() {
    if (!titleEl || !gridEl) return;

    titleEl.textContent = monthTitle(current);
    gridEl.innerHTML = "";

    const year = current.getFullYear();
    const month = current.getMonth();

    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);

    // Lundi = 0
    const startIdx = (first.getDay() + 6) % 7;

    // Cases vides avant le 1er jour
    for (let i = 0; i < startIdx; i++) {
      const div = document.createElement("div");
      div.className = "day muted";
      div.innerHTML = `<div class="num"></div>`;
      gridEl.appendChild(div);
    }

    for (let day = 1; day <= last.getDate(); day++) {
      const d = new Date(year, month, day);
      const dayStr = ymd(d);
      const list = bookingsForDay(dayStr);

      const div = document.createElement("div");
      div.className = "day";

      div.innerHTML = `
        <div class="num">${day}</div>
        ${list
          .slice(0, 3)
          .map(
            (b) => `
              <span class="chip">
                🏛️ ${b.room || "Salle ?"} ${timeHM(b.start)}-${timeHM(b.end)}<br>
                <b>${b.title || ""}</b>
              </span>
            `
          )
          .join("")}
        ${
          list.length > 3
            ? `<div class="smallgray">+${list.length - 3} autres...</div>`
            : ""
        }
      `;

      div.addEventListener("click", () => openDay(dayStr));
      gridEl.appendChild(div);
    }
  }

  function buildSlots(dayStr, room) {
    const startHour = 8;
    const endHour = 22;

    const dayBookings = bookingsForDay(dayStr).filter(
      (b) => !room || b.room === room
    );

    const slots = [];

    for (let h = startHour; h < endHour; h++) {
      const s = `${dayStr}T${String(h).padStart(2, "0")}:00`;
      const e = `${dayStr}T${String(h + 1).padStart(2, "0")}:00`;

      const conflict = dayBookings.find((b) => overlaps(s, e, b.start, b.end));

      slots.push({ s, e, conflict });
    }

    return slots;
  }

  function openDay(dayStr) {
    selectedDayStr = dayStr;

    if (panel) panel.style.display = "block";
    if (panelTitle) panelTitle.textContent = `Jour : ${dayStr}`;

    renderSlots();

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }

  function renderSlots() {
    if (!slotsEl || !selectedDayStr) return;

    const room = roomFilter ? roomFilter.value : "";
    const slots = buildSlots(selectedDayStr, room);

    slotsEl.innerHTML = slots
      .map((sl) => {
        if (sl.conflict) {
          return `
            <div class="slot busy">
              <div class="t">
                <span class="badge busy">⛔ Réservé</span>
                ${timeHM(sl.s)} - ${timeHM(sl.e)}
              </div>
              <div class="meta">Salle : <b>${sl.conflict.room || "?"}</b></div>
              <div class="meta"><b>${sl.conflict.title || ""}</b></div>
            </div>
          `;
        }

        const href =
          `reserve-room.html?start=${encodeURIComponent(sl.s)}` +
          `&end=${encodeURIComponent(sl.e)}` +
          `&room=${encodeURIComponent(room || "")}`;

        return `
          <a class="slot free" href="${href}">
            <div class="t">
              <span class="badge free">Libre</span>
              ${timeHM(sl.s)} - ${timeHM(sl.e)}
            </div>
            <div class="meta">Cliquer pour réserver</div>
          </a>
        `;
      })
      .join("");
  }

  document.getElementById("prev")?.addEventListener("click", () => {
    current.setMonth(current.getMonth() - 1);
    current.setDate(1);
    renderMonth();
    if (panel) panel.style.display = "none";
  });

  document.getElementById("next")?.addEventListener("click", () => {
    current.setMonth(current.getMonth() + 1);
    current.setDate(1);
    renderMonth();
    if (panel) panel.style.display = "none";
  });

  document.getElementById("closePanel")?.addEventListener("click", () => {
    if (panel) panel.style.display = "none";
  });

  roomFilter?.addEventListener("change", () => {
    if (selectedDayStr) renderSlots();
  });

  renderMonth();
});