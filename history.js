// js/history.js

function escapeHtml(v) {

  return String(v || "")

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;");

}

function renderHistory() {

  const tbody = document.getElementById("tbody");

  if (!tbody) return;

  const user = getUser();

  if (!user) {

    window.location.href = "login.html";

    return;

  }

  const history = JSON.parse(localStorage.getItem("hp_history") || "[]");

  tbody.innerHTML = "";

  if (history.length === 0) {

    const tr = document.createElement("tr");

    tr.innerHTML =

      '<td colspan="6" style="color:gray;">Aucune action enregistrée.</td>';

    tbody.appendChild(tr);

    return;

  }

  history.reverse().forEach((h) => {

    const tr = document.createElement("tr");

    tr.innerHTML = `
<td>${escapeHtml(h.date)}</td>
<td>${escapeHtml(h.user)}</td>
<td>${escapeHtml(h.role)}</td>
<td>${escapeHtml(h.action)}</td>
<td>${escapeHtml(h.title)}</td>
<td>${escapeHtml(h.id)}</td>

    `;

    tbody.appendChild(tr);

  });

}

document.addEventListener("DOMContentLoaded", () => {

  requireAuth();

  renderHistory();

});
 
