document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/api/users/me", {
      credentials: "include"
    });

    if (res.status === 401) {
      window.location.replace("login.html");
      return;
    }

    if (res.status === 200) {
      const data = await res.json();
      document.getElementById("welcomeText").innerText =
        `Bienvenido ${data.user.usuario}`;
    }

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", async (e) => {
      e.preventDefault();
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
      window.location.replace("login.html");
    });

  } catch (error) {
    console.error("Error verificando sesión:", error);
    window.location.replace("login.html");
  }
});