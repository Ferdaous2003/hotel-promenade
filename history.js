// js/history.js

function fmt(iso) {
  return (iso || "").replace("T", " ").split(".")[0];
}

function actionFr(a) {
  if (a === "EVENT_CREATED") return "Création";
  if (a === "EVENT_UPDATED") return "Modification";
  if (a === "EVENT_VALIDATED") return "Validation";
  if (a === "EVENT_CANCELLED") return "Annulation";
  return a || "";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getVisibleHistoryItems(items, user) {
  if (!user) return [];

  // Admin voit tout l'historique
  if (user.role === "administrateur") {
    return items;
  }

  // Les autres voient seulement l'historique
  // des événements qu'ils ont créés
  const events = getEvents();
  const myEventIds = new Set(
    events
      .filter((ev) => ev.created_by === user.email)
      .map((ev) => String(ev.id))
  );

  return items.filter((it) => {
    const eventId = it?.details?.eventId;
    return eventId && myEventIds.has(String(eventId));
  });
}

function render() {
  const tbody = document.getElementById("tbody");
  if (!tbody) return;

  const user = getUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const items = getHistory(); // depuis app.js
  const visibleItems = getVisibleHistoryItems(items, user);

  tbody.innerHTML = "";

  if (!visibleItems.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6" style="color:gray;">Aucune action enregistrée.</td>`;
    tbody.appendChild(tr);
    return;
  }

  visibleItems.forEach((it) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(fmt(it.at))}</td>
      <td>${escapeHtml(it.by_name || it.by || "")}</td>
      <td>${escapeHtml(it.role || "")}</td>
      <td>${escapeHtml(actionFr(it.action))}</td>
      <td>${escapeHtml(it.details?.title || "")}</td>
      <td>${escapeHtml(it.details?.eventId || "")}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  requireAuth();
  render();
});