const tbody = document.getElementById("usersTbody");
const btnAdd = document.getElementById("btnAddUser");
const btnReset = document.getElementById("btnResetUsers");

const uName = document.getElementById("uName");
const uEmail = document.getElementById("uEmail");
const uPassword = document.getElementById("uPassword");
const uRole = document.getElementById("uRole");
const msg = document.getElementById("msgUser");

function showMsg(text) {
  if (!msg) return;
  msg.textContent = text;
  setTimeout(() => (msg.textContent = ""), 2500);
}

function renderUsers() {
  const users = getUsers();
  tbody.innerHTML = "";

  users.forEach((u) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.id}</td>
      <td>${u.full_name || ""}</td>
      <td>${u.email || ""}</td>
      <td>${u.role || ""}</td>
      <td>${u.active ? "✅" : "❌"}</td>
      <td>
        <button class="btn-secondary" data-id="${u.id}">
          ${u.active ? "Désactiver" : "Activer"}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.getAttribute("data-id"), 10);
      toggleUserActive(id);
      renderUsers();
    });
  });
}

btnAdd.addEventListener("click", () => {
  const full_name = (uName.value || "").trim();
  const email = (uEmail.value || "").trim().toLowerCase();
  const password = (uPassword.value || "").trim();
  const role = uRole.value;

  if (!full_name || !email || !password || !role) {
    showMsg("⚠️ Remplis tous les champs.");
    return;
  }

  const users = getUsers();
  if (users.some((x) => (x.email || "").toLowerCase() === email)) {
    showMsg(" Email déjà utilisé.");
    return;
  }

  addUser({ full_name, email, password, role, active: true });

  uName.value = "";
  uEmail.value = "";
  uPassword.value = "";
  uRole.value = "organisateur";

  showMsg("Utilisateur ajouté.");
  renderUsers();
});

btnReset.addEventListener("click", () => {
  clearUsersToDefault();
  showMsg(" Comptes reset (demo).");
  renderUsers();
});

renderUsers();