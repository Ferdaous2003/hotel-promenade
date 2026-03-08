// =====================
// js/events-list.js
// Page : Mes événements
// =====================

function formatDT(s) {
  return (s || "").replace("T", " ");
}

function statusLabel(s) {
  if (s === "valide") return "validé";
  if (s === "brouillon") return "brouillon";
  if (s === "annule") return "annulé";
  return s || "";
}

function getVisibleEvents(allEvents, user) {
  if (!user) return [];

  // Admin voit tout
  if (user.role === "administrateur") {
    return allEvents;
  }

  // Organisateur voit seulement SES événements
  if (user.role === "organisateur") {
    return allEvents.filter(
      (ev) => ev.created_by && ev.created_by === user.email
    );
  }

  // Coordonnateur et comptabilité ne voient rien ici
  return [];
}

function removeEventById(id) {
  const events = getEvents().filter((e) => String(e.id) !== String(id));
  saveEvents(events);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function guessMimeType(name, dataUrl) {
  const lower = String(name || "").toLowerCase();

  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".txt")) return "text/plain;charset=utf-8";
  if (lower.endsWith(".csv")) return "text/csv;charset=utf-8";
  if (lower.endsWith(".json")) return "application/json;charset=utf-8";
  if (lower.endsWith(".ipynb")) return "application/json;charset=utf-8";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) {
    return "text/html;charset=utf-8";
  }

  const match = String(dataUrl || "").match(/^data:([^;,]+)[;,]/i);
  if (match && match[1] && !/octet-stream/i.test(match[1])) {
    return match[1];
  }

  return "application/octet-stream";
}

function dataUrlToBlob(dataUrl, mimeOverride) {
  const parts = String(dataUrl || "").split(",");
  if (parts.length < 2) {
    return new Blob([], { type: mimeOverride || "application/octet-stream" });
  }

  const header = parts[0];
  const body = parts.slice(1).join(",");
  const isBase64 = /;base64/i.test(header);

  let mime = mimeOverride;
  if (!mime) {
    const match = header.match(/^data:([^;,]+)/i);
    mime = match ? match[1] : "application/octet-stream";
  }

  if (isBase64) {
    const binary = atob(body);
    const len = binary.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new Blob([bytes], { type: mime });
  }

  const text = decodeURIComponent(body);
  return new Blob([text], { type: mime });
}

function openAttachment(dataUrl, name) {
  if (!dataUrl) return;

  const lowerName = String(name || "").toLowerCase();

  // Cas spécial : fichier ipynb / json => affichage lisible dans une page HTML
  if (lowerName.endsWith(".ipynb") || lowerName.endsWith(".json")) {
    try {
      const parts = String(dataUrl).split(",");
      const raw = parts.length > 1 ? decodeURIComponent(parts[1]) : "";
      const escaped = raw
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      const html = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <title>${escapeHtml(name)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              background: #f7f7f7;
              color: #222;
            }
            h2 {
              margin-bottom: 16px;
            }
            pre {
              background: white;
              border: 1px solid #ccc;
              padding: 16px;
              white-space: pre-wrap;
              word-break: break-word;
              overflow-x: auto;
              border-radius: 8px;
            }
          </style>
        </head>
        <body>
          <h2>Consultation du fichier : ${escapeHtml(name)}</h2>
          <pre>${escaped}</pre>
        </body>
        </html>
      `;

      const win = window.open("", "_blank");
      if (!win) {
        alert("Impossible d’ouvrir le fichier.");
        return;
      }

      win.document.open();
      win.document.write(html);
      win.document.close();
      return;
    } catch (e) {
      console.error(e);
      alert("Impossible d’ouvrir ce fichier.");
      return;
    }
  }

  // Cas normal : PDF, image, etc.
  const mime = guessMimeType(name, dataUrl);
  const blob = dataUrlToBlob(dataUrl, mime);
  const url = URL.createObjectURL(blob);

  const win = window.open(url, "_blank", "noopener,noreferrer");

  if (!win) {
    // Si le navigateur bloque l’ouverture
    window.location.href = url;
  }

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60000);
}

function attachmentsHtml(ev) {
  const att = Array.isArray(ev.attachments) ? ev.attachments : [];

  if (att.length === 0) {
    return `<span class="small" style="color:gray;">Aucun fichier</span>`;
  }

  return att
    .map((a, index) => {
      const name = a?.name || "document";
      const dataUrl = a?.dataUrl;

      if (!dataUrl) {
        return `<div class="small">📎 ${escapeHtml(name)}</div>`;
      }

      const key = `${ev.id}_${index}`;

      // Stockage temporaire pour ouverture au clic
      window.__hpAttachmentsMap[key] = {
        name,
        dataUrl
      };

      return `
        <div class="small">
          <button
            type="button"
            data-open-file="${escapeHtml(key)}"
            style="
              background:none;
              border:none;
              padding:0;
              margin:0;
              color:#0a58ca;
              text-decoration:underline;
              cursor:pointer;
              font:inherit;
            "
          >
            📎 ${escapeHtml(name)}
          </button>
        </div>
      `;
    })
    .join("");
}

function getInvoiceByEventId(eventId) {
  const raw = localStorage.getItem("hp_invoices");

  if (!raw) return null;

  try {
    const arr = JSON.parse(raw);

    if (!Array.isArray(arr)) return null;

    return arr.find((inv) => String(inv.eventId) === String(eventId)) || null;
  } catch {
    return null;
  }
}

function invoiceStatusLabel(s) {
  if (s === "en_attente") return "🕒 en attente";
  if (s === "payee") return "✅ payée";
  if (s === "retard") return "⚠️ retard";
  if (s === "annulee") return "❌ annulée";
  return s || "";
}

function renderEventsTable() {
  const user = getUser();
  const tbody = document.getElementById("tbody");
  const empty = document.getElementById("empty");
  const btnClear = document.getElementById("btnClearMyEvents");

  if (!tbody) return;

  const all = getEvents();
  const events = getVisibleEvents(all, user);

  tbody.innerHTML = "";
  window.__hpAttachmentsMap = {};

  // Si coordonnateur ou comptabilité arrivent sur cette page
  if (
    user &&
    user.role !== "administrateur" &&
    user.role !== "organisateur"
  ) {
    if (empty) {
      empty.textContent =
        "Cette page est réservée à l’administrateur et à l’organisateur.";
    }

    if (btnClear) btnClear.style.display = "none";
    return;
  }

  if (!events.length) {
    if (empty) empty.textContent = "Aucun événement à afficher.";
    if (btnClear && user?.role !== "organisateur") {
      btnClear.style.display = "none";
    }
    return;
  }

  if (empty) empty.textContent = "";

  // Bouton supprimer tous MES événements :
  // visible seulement pour organisateur
  if (btnClear) {
    btnClear.style.display =
      user && user.role === "organisateur" ? "inline-block" : "none";
  }

  events.forEach((ev) => {
    const tr = document.createElement("tr");
    const inv = getInvoiceByEventId(ev.id);

    const canEdit =
      user &&
      (user.role === "administrateur" ||
        (user.role === "organisateur" && ev.created_by === user.email));

    tr.innerHTML = `
      <td>${escapeHtml(ev.title || "")}</td>
      <td>${escapeHtml(ev.type || "")}</td>
      <td>${escapeHtml(formatDT(ev.start))}</td>
      <td>${escapeHtml(formatDT(ev.end))}</td>
      <td>${escapeHtml(ev.room || "")}</td>
      <td>${escapeHtml(ev.budget ?? "")}</td>
      <td>${escapeHtml(ev.participants ?? "")}</td>
      <td>${escapeHtml(statusLabel(ev.status))}</td>
      <td>
        ${
          canEdit
            ? `
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn-secondary" data-edit="${ev.id}">✏️ Modifier</button>
            <button class="btn-secondary" data-del="${ev.id}">🗑️ Supprimer</button>
          </div>
          `
            : `<span style="color:gray;">Aucune action</span>`
        }
        <div style="margin-top:8px;">
          ${attachmentsHtml(ev)}
        </div>
      </td>
      <td>
        ${
          inv
            ? invoiceStatusLabel(inv.status)
            : `<span style="color:gray;">(pas générée)</span>`
        }
      </td>
    `;

    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("button[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-edit");
      window.location.href = `edit-event.html?id=${encodeURIComponent(id)}`;
    });
  });

  tbody.querySelectorAll("button[data-del]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-del");

      if (confirm("Supprimer cet événement ?")) {
        removeEventById(id);
        renderEventsTable();
      }
    });
  });

  tbody.querySelectorAll("button[data-open-file]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.getAttribute("data-open-file");
      const file = window.__hpAttachmentsMap[key];

      if (!file || !file.dataUrl) {
        alert("Impossible d’ouvrir ce fichier.");
        return;
      }

      openAttachment(file.dataUrl, file.name);
    });
  });
}

function clearMyEvents() {
  const user = getUser();
  if (!user || user.role !== "organisateur") return;

  const events = getEvents().filter((ev) => ev.created_by !== user.email);

  saveEvents(events);
  renderEventsTable();
}

window.clearMyEvents = clearMyEvents;

document.addEventListener("DOMContentLoaded", () => {
  requireAuth();
  renderEventsTable();
});