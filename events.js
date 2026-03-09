// js/events.js
// Création événement + sauvegarde des pièces jointes dans localStorage

function $(id) {
  return document.getElementById(id);
}

function showMsg(text, ok = true) {
  const msg = $("msg");
  if (!msg) return;
  msg.style.color = ok ? "green" : "crimson";
  msg.textContent = text;
}

function getSelectedServices() {
  return Array.from(document.querySelectorAll(".service:checked")).map((c) => c.value);
}

function guessMimeType(file) {
  const name = String(file?.name || "").toLowerCase();
  const nativeType = String(file?.type || "").trim();

  if (nativeType) return nativeType;

  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".svg")) return "image/svg+xml";
  if (name.endsWith(".txt")) return "text/plain;charset=utf-8";
  if (name.endsWith(".csv")) return "text/csv;charset=utf-8";
  if (name.endsWith(".json")) return "application/json;charset=utf-8";
  if (name.endsWith(".ipynb")) return "application/json;charset=utf-8";
  if (name.endsWith(".html") || name.endsWith(".htm")) return "text/html;charset=utf-8";
  if (name.endsWith(".js")) return "text/javascript;charset=utf-8";
  if (name.endsWith(".css")) return "text/css;charset=utf-8";
  if (name.endsWith(".xml")) return "application/xml;charset=utf-8";

  return "application/octet-stream";
}

function isTextLikeMime(mime) {
  return (
    mime.startsWith("text/") ||
    mime.includes("json") ||
    mime.includes("javascript") ||
    mime.includes("xml")
  );
}

function buildTextDataUrl(text, mime) {
  return `data:${mime},${encodeURIComponent(text)}`;
}

function fileToData(file) {
  return new Promise((resolve) => {
    const mime = guessMimeType(file);
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        name: file.name,
        type: mime,
        size: file.size || 0,
        dataUrl: reader.result
      });
    };

    reader.onerror = () => {
      resolve({
        name: file.name,
        type: mime,
        size: file.size || 0,
        dataUrl: null
      });
    };

    if (isTextLikeMime(mime)) {
      reader.onload = () => {
        resolve({
          name: file.name,
          type: mime,
          size: file.size || 0,
          dataUrl: buildTextDataUrl(reader.result || "", mime)
        });
      };
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  });
}

async function readAttachments() {
  const input = $("attachments");

  if (!input || !input.files || input.files.length === 0) {
    return [];
  }

  const files = Array.from(input.files);

  const total = files.reduce((sum, f) => sum + (f.size || 0), 0);
  const MAX_TOTAL = 1_500_000; // 1.5 MB

  if (total > MAX_TOTAL) {
    showMsg("Fichiers trop lourds (≤ 1.5MB au total).", false);
    return null;
  }

  const out = [];
  for (const f of files) {
    out.push(await fileToData(f));
  }

  return out;
}

function makeId() {
  return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
}

async function createEvent(status) {
  const user = getUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const title = ($("title")?.value || "").trim();
  const type = ($("type")?.value || "").trim();
  const description = ($("description")?.value || "").trim();
  const start = ($("start")?.value || "").trim();
  const end = ($("end")?.value || "").trim();
  const room = ($("room")?.value || "").trim();
  const budget = Number(($("budget")?.value || "0").trim());
  const participants = Number(($("participants")?.value || "0").trim());

  if (!title || !type || !start || !end || !room) {
    showMsg("Remplis au minimum : Titre, Type, Début, Fin, Salle.", false);
    return;
  }

  if (start >= end) {
    showMsg("La fin doit être après le début.", false);
    return;
  }

  showMsg("⏳ Sauvegarde en cours...");

  const attachments = await readAttachments();
  if (attachments === null) return;

  const events = getEvents();

  const newEvent = {
    id: makeId(),
    title,
    type,
    description,
    start,
    end,
    room,
    budget,
    participants,
    services: getSelectedServices(),
    status, // brouillon / valide
    created_by: user.email,
    created_by_name: user.full_name,
    created_at: new Date().toISOString(),
    attachments: attachments || []
  };

  events.push(newEvent);

  try {
    saveEvents(events);
  } catch (e) {
    console.error(e);
    showMsg("Stockage plein (localStorage). Utilise un fichier plus petit.", false);
    return;
  }

  if (typeof addHistory === "function") {
    addHistory("EVENT_CREATED", {
      title: newEvent.title,
      eventId: newEvent.id,
      status: newEvent.status
    });
  }

  showMsg(status === "valide" ? "Événement validé !" : "Brouillon enregistré !");
  setTimeout(() => {
    window.location.href = "events-list.html";
  }, 600);
}

document.addEventListener("DOMContentLoaded", () => {
  $("btnDraft")?.addEventListener("click", (e) => {
    e.preventDefault();
    createEvent("brouillon");
  });

  $("btnValidate")?.addEventListener("click", (e) => {
    e.preventDefault();
    createEvent("valide");
  });
});
