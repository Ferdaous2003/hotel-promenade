// js/edit-event.js
// Modifier un événement (garde attachments + historique)

function $(id) {
  return document.getElementById(id);
}

function setMsg(text, ok = true) {
  const msg = $("msg");
  if (!msg) return;
  msg.style.color = ok ? "green" : "crimson";
  msg.textContent = text;
}

function statusText(s) {
  if (s === "valide") return "Statut : validé";
  if (s === "brouillon") return "Statut : brouillon";
  if (s === "annule") return " Statut : annulé";
  return `Statut : ${s || "-"}`;
}

function canEditAny(role) {
  return role === "administrateur" || role === "coordonnateur";
}

function getEventById(id) {
  return getEvents().find((e) => String(e.id) === String(id));
}

function updateEvent(updated) {
  const events = getEvents().map((e) =>
    String(e.id) === String(updated.id) ? updated : e
  );
  saveEvents(events);
}

function logHistory(action, details) {
  if (typeof addHistory === "function") addHistory(action, details);
}

function getSelectedServices() {
  return Array.from(document.querySelectorAll(".service:checked")).map(
    (c) => c.value
  );
}

function setServices(services) {
  const set = new Set(Array.isArray(services) ? services : []);
  document.querySelectorAll(".service").forEach((c) => {
    c.checked = set.has(c.value);
  });
}

function renderAttachmentsList(ev) {
  const box = $("attachmentsList");
  if (!box) return;

  const att = Array.isArray(ev.attachments) ? ev.attachments : [];
  if (att.length === 0) {
    box.innerHTML = `<span class="small" style="color:gray;">Aucun fichier</span>`;
    return;
  }

  box.innerHTML = att
    .map((a) => {
      const name = a?.name || "document";
      const dataUrl = a?.dataUrl;
      if (!dataUrl) return `📎 ${name}`;
      return `📎 <a href="${dataUrl}" download="${name}" target="_blank">${name}</a>`;
    })
    .join("<br/>");
}

document.addEventListener("DOMContentLoaded", () => {
  const user = getUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    setMsg("ID événement manquant.", false);
    setTimeout(() => (window.location.href = "events-list.html"), 800);
    return;
  }

  let ev = getEventById(id);
  if (!ev) {
    setMsg("Événement introuvable.", false);
    setTimeout(() => (window.location.href = "events-list.html"), 800);
    return;
  }

  //  organisateur: seulement ses événements
  if (!canEditAny(user.role)) {
    if (ev.created_by && ev.created_by !== user.email) {
      alert("Accès refusé : ce n'est pas votre événement.");
      window.location.href = "events-list.html";
      return;
    }
  }

  // Remplir formulaire
  $("title").value = ev.title || "";
  $("type").value = ev.type || "";
  $("description").value = ev.description || "";
  $("start").value = ev.start || "";
  $("end").value = ev.end || "";
  $("room").value = ev.room || "";
  $("budget").value = ev.budget ?? "";
  $("participants").value = ev.participants ?? "";

  setServices(ev.services);
  $("statusLine").textContent = statusText(ev.status);
  renderAttachmentsList(ev);

  const btnSave = $("btnSave");
  const btnValidate = $("btnValidate");
  const btnCancel = $("btnCancel");

  if (btnValidate) {
    btnValidate.style.display = ev.status === "valide" ? "none" : "inline-block";
  }

  // Enregistrer
  btnSave?.addEventListener("click", (e) => {
    e.preventDefault();
    btnSave.disabled = true;
setTimeout(() => (btnSave.disabled = false), 800);

    const title = ($("title").value || "").trim();
    const type = ($("type").value || "").trim();
    const description = ($("description").value || "").trim();
    const start = ($("start").value || "").trim();
    const end = ($("end").value || "").trim();
    const room = ($("room").value || "").trim();
    const budget = Number(($("budget").value || "0").trim());
    const participants = Number(($("participants").value || "0").trim());

    if (!title || !type || !start || !end || !room) {
      setMsg(" Remplis au minimum : Titre, Type, Début, Fin, Salle.", false);
      return;
    }
    if (start >= end) {
      setMsg("La fin doit être après le début.", false);
      return;
    }

    ev = {
      ...ev,
      title,
      type,
      description,
      start,
      end,
      room,
      budget,
      participants,
      services: getSelectedServices(),
      updated_at: new Date().toISOString(),
    };

    updateEvent(ev);
    logHistory("EVENT_UPDATED", { eventId: ev.id, title: ev.title });

    $("statusLine").textContent = statusText(ev.status);
    renderAttachmentsList(ev);
    setMsg(" Modifications enregistrées.");
  });

  // Valider
  btnValidate?.addEventListener("click", (e) => {
    e.preventDefault();

    ev = {
      ...ev,
      status: "valide",
      updated_at: new Date().toISOString(),
    };

    updateEvent(ev);
    logHistory("EVENT_VALIDATED", { eventId: ev.id, title: ev.title });

    $("statusLine").textContent = statusText(ev.status);
    if (btnValidate) btnValidate.style.display = "none";
    setMsg("Événement validé !");
  });

  // Annuler
  btnCancel?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!confirm("Annuler cet événement ?")) return;

    ev = {
      ...ev,
      status: "annule",
      updated_at: new Date().toISOString(),
    };

    updateEvent(ev);
    logHistory("EVENT_CANCELLED", { eventId: ev.id, title: ev.title });

    setMsg(" Événement annulé.");
    setTimeout(() => (window.location.href = "events-list.html"), 600);
  });
});