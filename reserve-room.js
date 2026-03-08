// =====================
// js/reserve-room.js
// Réservation des salles
// =====================

document.addEventListener("DOMContentLoaded", () => {
  requireAuth();
  requirePerm("RESERVE_ROOM");

  // "base de salles" mock
  const ROOMS = [
    { name: "Salle A", capacity: 50, equipment: ["projecteur"] },
    { name: "Salle B", capacity: 120, equipment: ["son", "micro"] },
    { name: "Salle C", capacity: 30, equipment: ["ecran"] },
    { name: "Salle D", capacity: 80, equipment: ["ecran", "micro"] },
    { name: "Salle E", capacity: 200, equipment: ["son", "micro", "projecteur"] },
  ];

  const roomEl = document.getElementById("room");
  const roomViewEl = document.getElementById("roomView");
  const minCapEl = document.getElementById("minCapacity");
  const equipEl = document.getElementById("equipment");
  const startEl = document.getElementById("start");
  const endEl = document.getElementById("end");
  const btn = document.getElementById("btnReserve");

  const resBody = document.getElementById("resBody");
  const resTable = document.getElementById("resTable");
  const emptyRes = document.getElementById("emptyRes");
  const thCreatedBy = document.getElementById("thCreatedBy");

  const currentUser = getUser();
  const canManualReserve =
    currentUser?.role === "administrateur" ||
    currentUser?.role === "coordonnateur";

  function showMessage(text, isError = false) {
    const msg = document.getElementById("msg");
    if (!msg) return;
    msg.style.color = isError ? "red" : "green";
    msg.textContent = text;
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("fr-CA");
  }

  function overlaps(aStart, aEnd, bStart, bEnd) {
    if (!aStart || !aEnd || !bStart || !bEnd) return false;
    return aStart < bEnd && bStart < aEnd;
  }

  function isCancelledStatus(status) {
    const s = (status || "").toLowerCase();
    return (
      s === "annulé" ||
      s === "annule" ||
      s === "annulée" ||
      s === "annulee"
    );
  }

  function getEventRoom(ev) {
    return ev.room || ev.room_requested || "";
  }

  function getEventStart(ev) {
    return ev.start || ev.start_datetime || "";
  }

  function getEventEnd(ev) {
    return ev.end || ev.end_datetime || "";
  }

  function isValidatedEventStatus(status) {
    const s = (status || "").toLowerCase();
    return (
      s === "validé" ||
      s === "valide" ||
      s === "validée" ||
      s === "validee"
    );
  }

  function hasValidatedEventConflict(room, start, end) {
    const events = getEvents();

    return events.some((ev) => {
      if (!isValidatedEventStatus(ev.status)) return false;
      if (getEventRoom(ev) !== room) return false;

      const evStart = getEventStart(ev);
      const evEnd = getEventEnd(ev);

      return overlaps(start, end, evStart, evEnd);
    });
  }

  function renderRoomOptions() {
    const minCap = minCapEl?.value ? Number(minCapEl.value) : 0;
    const equip = equipEl?.value || "";

    const filtered = ROOMS.filter((room) => {
      if (minCap && room.capacity < minCap) return false;
      if (equip && !room.equipment.includes(equip)) return false;
      return true;
    });

    if (roomEl) {
      roomEl.innerHTML = `<option value="">-- Choisir --</option>`;
      filtered.forEach((room) => {
        roomEl.insertAdjacentHTML(
          "beforeend",
          `<option value="${room.name}">
            ${room.name} (${room.capacity} pers, ${room.equipment.join(", ") || "—"})
          </option>`
        );
      });
    }

    if (roomViewEl) {
      roomViewEl.innerHTML = `<option value="">Toutes les salles</option>`;
      ROOMS.forEach((room) => {
        roomViewEl.insertAdjacentHTML(
          "beforeend",
          `<option value="${room.name}">${room.name}</option>`
        );
      });
    }
  }

  function renderReservations() {
    const reservations = getReservations();
    const roomFilter = roomViewEl?.value || "";
    const user = getUser();
    const isOrganizer = user?.role === "organisateur";

    if (thCreatedBy) {
      thCreatedBy.style.display = isOrganizer ? "none" : "";
    }

    const events = getEvents();
    const eventTitleById = new Map(
      events.map((ev) => [String(ev.id), ev.title || ""])
    );

    const list = roomFilter
      ? reservations.filter((r) => r.room === roomFilter)
      : [...reservations];

    list.sort(
      (a, b) =>
        new Date(a.start_datetime || a.start).getTime() -
        new Date(b.start_datetime || b.start).getTime()
    );

    if (!resBody) return;
    resBody.innerHTML = "";

    if (!list.length) {
      if (emptyRes) emptyRes.textContent = "Aucune réservation enregistrée.";
      if (resTable) resTable.style.display = "none";
      return;
    }

    if (emptyRes) emptyRes.textContent = "";
    if (resTable) resTable.style.display = "table";

    for (const r of list) {
      const tr = document.createElement("tr");

      let eventTitle = "—";
      if (r.event_id) {
        eventTitle =
          eventTitleById.get(String(r.event_id)) || `Événement #${r.event_id}`;
      }

      const sourceLabel =
        r.source === "event_validation"
          ? "Depuis événement"
          : r.source === "manual"
          ? "Manuelle"
          : "";

      const startValue = r.start_datetime || r.start || "";
      const endValue = r.end_datetime || r.end || "";

      tr.innerHTML = `
        <td>${r.room || ""}</td>
        <td>${formatDate(startValue)}</td>
        <td>${formatDate(endValue)}</td>
        <td>${eventTitle}</td>
        <td>${r.status || ""}${sourceLabel ? ` (${sourceLabel})` : ""}</td>
        <td style="${isOrganizer ? "display:none;" : ""}">
          ${r.created_by || ""}
        </td>
      `;

      resBody.appendChild(tr);
    }
  }

  function applyQueryParamsToForm() {
    const params = new URLSearchParams(window.location.search);

    const start = params.get("start");
    const end = params.get("end");
    const room = params.get("room");

    if (startEl && start) startEl.value = start;
    if (endEl && end) endEl.value = end;
    if (roomEl && room) roomEl.value = room;
  }

  function handleReserve() {
    if (!canManualReserve) return;

    showMessage("");

    const room = roomEl?.value || "";
    const start = startEl?.value || "";
    const end = endEl?.value || "";

    if (!room || !start || !end) {
      showMessage("Remplis : salle, début, fin.", true);
      return;
    }

    if (new Date(start) >= new Date(end)) {
      showMessage("La date de fin doit être après la date de début.", true);
      return;
    }

    const reservations = getReservations();

    const conflict = reservations.some((r) => {
      if (isCancelledStatus(r.status)) return false;
      if (r.room !== room) return false;

      const rs = r.start_datetime || r.start;
      const re = r.end_datetime || r.end;

      return overlaps(start, end, rs, re);
    });

    if (conflict) {
      showMessage(
        "Conflit : cette salle est déjà réservée sur ce créneau.",
        true
      );
      return;
    }

    if (hasValidatedEventConflict(room, start, end)) {
      showMessage(
        "Conflit : un événement validé existe déjà sur ce créneau pour cette salle.",
        true
      );
      return;
    }

    const user = getUser();

    const newReservation = {
      id: Date.now(),
      event_id: null,
      room: room,
      start_datetime: start,
      end_datetime: end,
      min_capacity: minCapEl?.value ? Number(minCapEl.value) : null,
      equipment: equipEl?.value || null,
      created_by: user?.email || "unknown",
      status: "confirmée",
      source: "manual",
    };

    reservations.push(newReservation);
    saveReservations(reservations);

    addHistory("Réservation manuelle d'une salle", {
      room: room,
      start: start,
      end: end,
    });

    showMessage("Réservation manuelle enregistrée.");
    renderReservations();

    if (roomEl) roomEl.value = "";
    if (startEl) startEl.value = "";
    if (endEl) endEl.value = "";
  }

  if (!canManualReserve && btn) {
    btn.disabled = true;
    showMessage(
      "ℹ️ Mode consultation : la réservation manuelle est réservée à l’administrateur et au coordonnateur."
    );
  }

  minCapEl?.addEventListener("input", renderRoomOptions);
  equipEl?.addEventListener("change", renderRoomOptions);
  roomViewEl?.addEventListener("change", renderReservations);
  btn?.addEventListener("click", handleReserve);

  renderRoomOptions();
  applyQueryParamsToForm();
  renderReservations();
});