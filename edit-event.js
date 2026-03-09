// js/edit-event.js

// Modifier événement + historique

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

  if (s === "annule") return "Statut : annulé";

  return `Statut : ${s || "-"}`;

}

function canEditAny(role) {

  return role === "administrateur" || role === "coordonnateur";

}

function getEventById(id) {

  const events = JSON.parse(localStorage.getItem("hp_events") || "[]");

  return events.find((e) => String(e.id) === String(id));

}

function updateEvent(updated) {

  const events = JSON.parse(localStorage.getItem("hp_events") || "[]");

  const newEvents = events.map((e) =>

    String(e.id) === String(updated.id) ? updated : e

  );

  localStorage.setItem("hp_events", JSON.stringify(newEvents));

}

function addHistory(action, title, id) {

  const user = getUser();

  const history = JSON.parse(localStorage.getItem("hp_history") || "[]");

  history.push({

    date: new Date().toLocaleString(),

    user: user.full_name,

    role: user.role,

    action: action,

    title: title,

    id: id

  });

  localStorage.setItem("hp_history", JSON.stringify(history));

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

    return;

  }

  let ev = getEventById(id);

  if (!ev) {

    setMsg("Événement introuvable.", false);

    return;

  }

  if (!canEditAny(user.role)) {

    if (ev.created_by && ev.created_by !== user.email) {

      alert("Accès refusé : ce n'est pas votre événement.");

      window.location.href = "events-list.html";

      return;

    }

  }

  $("title").value = ev.title || "";

  $("type").value = ev.type || "";

  $("description").value = ev.description || "";

  $("start").value = ev.start || "";

  $("end").value = ev.end || "";

  $("room").value = ev.room || "";

  $("budget").value = ev.budget ?? "";

  $("participants").value = ev.participants ?? "";

  setServices(ev.services);

  const btnSave = $("btnSave");

  const btnValidate = $("btnValidate");

  const btnCancel = $("btnCancel");

  if (btnValidate) {

    btnValidate.style.display = ev.status === "valide" ? "none" : "inline-block";

  }

  // MODIFIER

  btnSave?.addEventListener("click", (e) => {

    e.preventDefault();

    const title = ($("title").value || "").trim();

    const type = ($("type").value || "").trim();

    const description = ($("description").value || "").trim();

    const start = ($("start").value || "").trim();

    const end = ($("end").value || "").trim();

    const room = ($("room").value || "").trim();

    const budget = Number($("budget").value || 0);

    const participants = Number($("participants").value || 0);

    if (!title || !type || !start || !end || !room) {

      setMsg("Remplis les champs obligatoires.", false);

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

      updated_at: new Date().toISOString()

    };

    updateEvent(ev);

    addHistory("Modification événement", ev.title, ev.id);

    setMsg("Modifications enregistrées.");

  });

  // VALIDER

  btnValidate?.addEventListener("click", (e) => {

    e.preventDefault();

    ev = {

      ...ev,

      status: "valide",

      updated_at: new Date().toISOString()

    };

    updateEvent(ev);

    addHistory("Validation événement", ev.title, ev.id);

    if (btnValidate) btnValidate.style.display = "none";

    setMsg("Événement validé !");

  });

  // ANNULER

  btnCancel?.addEventListener("click", (e) => {

    e.preventDefault();

    if (!confirm("Annuler cet événement ?")) return;

    ev = {

      ...ev,

      status: "annule",

      updated_at: new Date().toISOString()

    };

    updateEvent(ev);

    addHistory("Annulation événement", ev.title, ev.id);

    setMsg("Événement annulé.");

    setTimeout(() => {

      window.location.href = "events-list.html";

    }, 600);

  });

});
 
