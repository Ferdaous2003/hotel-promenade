// js/events.js

// Création événement + sauvegarde + historique

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

  return Array.from(document.querySelectorAll(".service:checked")).map(

    (c) => c.value

  );

}

function fileToData(file) {

  return new Promise((resolve) => {

    const reader = new FileReader();

    reader.onload = () => {

      resolve({

        name: file.name,

        type: file.type,

        size: file.size,

        dataUrl: reader.result

      });

    };

    reader.onerror = () => {

      resolve({

        name: file.name,

        type: file.type,

        size: file.size,

        dataUrl: null

      });

    };

    reader.readAsDataURL(file);

  });

}

async function readAttachments() {

  const input = $("attachments");

  if (!input || !input.files || input.files.length === 0) {

    return [];

  }

  const files = Array.from(input.files);

  const out = [];

  for (const f of files) {

    out.push(await fileToData(f));

  }

  return out;

}

function makeId() {

  return Date.now().toString() + Math.floor(Math.random() * 1000);

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

  const budget = Number($("budget")?.value || 0);

  const participants = Number($("participants")?.value || 0);

  if (!title || !type || !start || !end || !room) {

    showMsg("Remplis au minimum : Titre, Type, Début, Fin, Salle.", false);

    return;

  }

  if (start >= end) {

    showMsg("La fin doit être après le début.", false);

    return;

  }

  showMsg("Sauvegarde en cours...");

  const attachments = await readAttachments();

  const events = JSON.parse(localStorage.getItem("hp_events") || "[]");

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

    status,

    created_by: user.email,

    created_by_name: user.full_name,

    created_at: new Date().toISOString(),

    attachments

  };

  events.push(newEvent);

  localStorage.setItem("hp_events", JSON.stringify(events));

  // ===== HISTORIQUE =====

  const history = JSON.parse(localStorage.getItem("hp_history") || "[]");

  history.push({

    date: new Date().toLocaleString(),

    user: user.full_name,

    role: user.role,

    action: "Création événement",

    title: newEvent.title,

    id: newEvent.id

  });

  localStorage.setItem("hp_history", JSON.stringify(history));

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
 
