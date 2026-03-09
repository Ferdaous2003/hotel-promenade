document.getElementById("btnLogin").addEventListener("click", function () {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // utilisateurs test
  const users = [
    { email: "admin@test.com", password: "1234", role: "administrateur", full_name: "Admin" },
    { email: "orga@test.com", password: "1234", role: "organisateur", full_name: "Organisateur" },
    { email: "coord@test.com", password: "1234", role: "coordonnateur", full_name: "Coordonnateur" },
    { email: "compta@test.com", password: "1234", role: "comptabilite", full_name: "Comptable" }
  ];

  const user = users.find(u => u.email === email && u.password === password);

  if (user) {

    localStorage.setItem("user", JSON.stringify(user));

    window.location.href = "dashboard.html";

  } else {

    alert("Email ou mot de passe incorrect");

  }

});
