// =====================
// LOGIN (mock) - Sprint 1
// =====================

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btnLogin = document.getElementById("btnLogin");
const errorDiv = document.getElementById("error");

// Comptes mock + rôles
// IMPORTANT : les rôles doivent être EXACTEMENT les mêmes dans app.js
const MOCK_USERS = [
  {
    email: "orga@test.com",
    password: "1234",
    full_name: "Organisateur Test",
    role: "organisateur",
  },
  {
    email: "admin@test.com",
    password: "1234",
    full_name: "Admin Test",
    role: "administrateur",
  },
  {
    email: "coord@test.com",
    password: "1234",
    full_name: "Coordonnateur Test",
    role: "coordonnateur",
  },
  {
    email: "compta@test.com",
    password: "1234",
    full_name: "Comptabilité Test",
    role: "comptabilite",
  },
];

function showError(message) {
  if (!errorDiv) return;
  errorDiv.textContent = message;
}

function doLogin() {
  const email = (emailInput?.value || "").trim().toLowerCase();
  const password = (passwordInput?.value || "").trim();

  showError("");

  if (!email || !password) {
    showError("Veuillez remplir l’email et le mot de passe.");
    return;
  }

  const foundUser = MOCK_USERS.find(
    (user) =>
      user.email.toLowerCase() === email &&
      user.password === password
  );

  if (!foundUser) {
    showError("Email ou mot de passe incorrect.");
    return;
  }

  const connectedUser = {
    full_name: foundUser.full_name,
    email: foundUser.email,
    role: foundUser.role,
  };

  localStorage.setItem("user", JSON.stringify(connectedUser));

  // Redirection simple vers le tableau de bord
  window.location.href = "dashboard.html";
}

// Clic sur le bouton
if (btnLogin) {
  btnLogin.addEventListener("click", doLogin);
}

// Touche Entrée
[emailInput, passwordInput].forEach((input) => {
  if (input) {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        doLogin();
      }
    });
  }
});