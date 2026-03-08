// =====================
// AUTH + RBAC + DATA (Sprint 1/2 mock)
// =====================

// ---------------------
// AUTH
// ---------------------
function getUser() {
  const u = localStorage.getItem("user");
  if (!u) return null;

  try {
    return JSON.parse(u);
  } catch (e) {
    return null;
  }
}

function requireAuth() {
  const user = getUser();
  if (!user) {
    window.location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

function renderWelcome() {
  const welcome = document.getElementById("welcome");
  const user = getUser();

  if (welcome && user) {
    welcome.textContent = `Bienvenue ${user.full_name} (${user.role})`;
  }
}

// ---------------------
// RBAC (Droits d'accès)
// ---------------------
const ROLES = {
  ADMIN: "administrateur",
  ORGA: "organisateur",
  COORD: "coordonnateur",
  COMPTA: "comptabilite",
};

// IMPORTANT :
// - Organisateur = crée et gère SES événements
// - Coordonnateur = gère la logistique, les salles, le calendrier
// - Comptabilité = facturation
// - Administrateur = accès global

const PERMS = {
  // Événements
  CREATE_EVENT: [ROLES.ADMIN, ROLES.ORGA],
  VIEW_MY_EVENTS: [ROLES.ADMIN, ROLES.ORGA],
  EDIT_EVENT: [ROLES.ADMIN, ROLES.ORGA],

  // Coordination / logistique
  VIEW_ALL_EVENTS: [ROLES.ADMIN, ROLES.COORD],
  RESERVE_ROOM: [ROLES.ADMIN, ROLES.COORD],
  VIEW_CALENDAR: [ROLES.ADMIN, ROLES.COORD],
  MANAGE_SERVICES: [ROLES.ADMIN, ROLES.COORD],

  // Historique
  // Admin voit tout
  // Les autres profils voient uniquement l'historique
  // des événements qu'ils ont créés (filtrage fait dans history.js)
  VIEW_HISTORY: [ROLES.ADMIN, ROLES.ORGA, ROLES.COORD, ROLES.COMPTA],

  // Administration
  ADMIN_USERS: [ROLES.ADMIN],

  // Comptabilité
  BILLING: [ROLES.ADMIN, ROLES.COMPTA],
};

function hasPerm(permKey) {
  const user = getUser();
  if (!user) return false;

  const allowedRoles = PERMS[permKey] || [];
  return allowedRoles.includes(user.role);
}

function requirePerm(permKey, redirect = "dashboard.html") {
  requireAuth();

  if (!hasPerm(permKey)) {
    alert("Accès refusé : vous n’avez pas les droits.");
    window.location.href = redirect;
  }
}

function hideIfNoPerm(permKey, selector) {
  const el = document.querySelector(selector);
  if (!el) return;

  if (!hasPerm(permKey)) {
    el.style.display = "none";
  }
}

// ---------------------
// Affichage selon le rôle
// ---------------------
function renderDashboardByRole() {
  const container = document.getElementById("role-content");
  const user = getUser();

  if (!container || !user) return;

  if (user.role === ROLES.ADMIN) {
    container.innerHTML = `
      <h2>Espace Administrateur</h2>
      <ul>
        <li><a href="admin-users.html">Gérer les utilisateurs</a></li>
        <li><a href="events-list.html">Voir tous les événements</a></li>
        <li><a href="calendar.html">Voir le calendrier</a></li>
        <li><a href="billing.html">Facturation</a></li>
        <li><a href="history.html">Historique</a></li>
      </ul>
    `;
  } else if (user.role === ROLES.ORGA) {
    container.innerHTML = `
      <h2>Espace Organisateur</h2>
      <ul>
        <li><a href="create-event.html">Créer un événement</a></li>
        <li><a href="events-list.html">Mes événements</a></li>
        <li><a href="edit-event.html">Modifier un événement</a></li>
        <li><a href="history.html">Historique</a></li>
      </ul>
    `;
  } else if (user.role === ROLES.COORD) {
    container.innerHTML = `
      <h2>Espace Coordonnateur hôtel</h2>
      <ul>
        <li><a href="calendar.html">Calendrier des salles</a></li>
        <li><a href="reserve-room.html">Réserver une salle</a></li>
        <li><a href="history.html">Historique des opérations</a></li>
      </ul>
    `;
  } else if (user.role === ROLES.COMPTA) {
    container.innerHTML = `
      <h2>Espace Comptabilité</h2>
      <ul>
        <li><a href="billing.html">Facturation</a></li>
        <li><a href="history.html">Historique</a></li>
      </ul>
    `;
  } else {
    container.innerHTML = `<p>Profil non reconnu.</p>`;
  }
}

// =====================
// EVENTS (mock)
// =====================
const EVENTS_KEY = "hp_events";

function getEvents() {
  const raw = localStorage.getItem(EVENTS_KEY);
  if (!raw) return [];

  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function saveEvents(events) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

function clearEvents() {
  localStorage.removeItem(EVENTS_KEY);

  if (typeof renderEventsTable === "function") {
    renderEventsTable();
  }
}

// =====================
// RESERVATIONS (mock)
// =====================
const RESERVATIONS_KEY = "hp_reservations";

function getReservations() {
  const raw = localStorage.getItem(RESERVATIONS_KEY);
  if (!raw) return [];

  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function saveReservations(reservations) {
  localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
}

function clearReservations() {
  localStorage.removeItem(RESERVATIONS_KEY);

  if (typeof renderReservationsTable === "function") {
    renderReservationsTable();
  }
}

// =====================
// USERS (mock) - Admin
// =====================
const USERS_KEY = "hp_users";

const DEFAULT_USERS = [
  {
    id: 1,
    email: "orga@test.com",
    password: "1234",
    full_name: "Organisateur Test",
    role: ROLES.ORGA,
    active: true,
  },
  {
    id: 2,
    email: "admin@test.com",
    password: "1234",
    full_name: "Admin Test",
    role: ROLES.ADMIN,
    active: true,
  },
  {
    id: 3,
    email: "coord@test.com",
    password: "1234",
    full_name: "Coordonnateur Test",
    role: ROLES.COORD,
    active: true,
  },
  {
    id: 4,
    email: "compta@test.com",
    password: "1234",
    full_name: "Comptabilité Test",
    role: ROLES.COMPTA,
    active: true,
  },
];

function initUsersIfNeeded() {
  const raw = localStorage.getItem(USERS_KEY);

  if (!raw) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
  }
}

function getUsers() {
  initUsersIfNeeded();

  try {
    const arr = JSON.parse(localStorage.getItem(USERS_KEY));
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function addUser(newUser) {
  const users = getUsers();
  const nextId = users.length
    ? Math.max(...users.map((u) => u.id || 0)) + 1
    : 1;

  users.push({
    id: nextId,
    active: true,
    ...newUser,
  });

  saveUsers(users);
}

function updateUser(id, patch) {
  const users = getUsers().map((u) =>
    u.id === id ? { ...u, ...patch } : u
  );

  saveUsers(users);
}

function toggleUserActive(id) {
  const users = getUsers().map((u) =>
    u.id === id ? { ...u, active: !u.active } : u
  );

  saveUsers(users);
}

function clearUsersToDefault() {
  localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
}

// =====================
// HISTORY (journal)
// =====================
const HISTORY_KEY = "hp_history";

function getHistory() {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];

  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

function addHistory(action, details = {}) {
  const user = getUser();
  const items = getHistory();

  items.unshift({
    id: Date.now().toString(),
    at: new Date().toISOString(),
    by: user ? user.email : "system",
    by_name: user ? user.full_name : "system",
    role: user ? user.role : "system",
    action,
    details,
  });

  saveHistory(items);
}

// =====================
// INVOICES (Factures) - Sprint 2
// =====================
window.HP_INVOICES_KEY = "hp_invoices";

function getInvoices() {
  const raw = localStorage.getItem(window.HP_INVOICES_KEY);
  if (!raw) return [];

  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function saveInvoices(items) {
  localStorage.setItem(window.HP_INVOICES_KEY, JSON.stringify(items));
}

function findInvoiceByEventId(eventId) {
  return getInvoices().find(
    (inv) => String(inv.eventId) === String(eventId)
  );
}

function invoiceStatusLabel(status) {
  if (status === "en_attente") return "🕒 en attente";
  if (status === "payee") return "✅ payée";
  if (status === "retard") return "⚠️ retard";
  if (status === "annulee") return "❌ annulée";

  return status || "";
}