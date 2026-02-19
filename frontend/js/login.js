const submitBtn = document.getElementById("submit"),
      passwordInput = document.getElementById("password"),
      usernameInput = document.getElementById("username"),
      visibleCheckbox = document.getElementById("visible");

// Mostrar u ocultar clave
visibleCheckbox.addEventListener("change", () => {
    passwordInput.type = visibleCheckbox.checked ? "text" : "password";
});

// Login
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const usuario = usernameInput.value.trim();
    const contrasena = passwordInput.value.trim();

    if (!usuario || !contrasena) {
        alert("Por favor rellene todos los campos");
        return;
    }

    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ usuario, contrasena })
        });

        const data = await res.json();

        if (res.ok) {
            window.location.href = "home.html";
        } else {
            alert("Error de autenticación: " + (data.error || "Usuario/clave incorrectos"));
            passwordInput.value = "";
        }
    } catch (err) {
        alert("Error al conectar con el servidor.");
        console.error(err);
    }
});

// Verificar sesion al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/api/users/me", {
      credentials: "include"
    });

    // Redirige a home si ya hay sesión activa
    if (res.status === 200) {
      if (!window.location.pathname.includes("home")) {
        window.location.replace("home.html");
      }
    }

  } catch (error) {
    console.error("Error verificando sesión:", error);
  }
});