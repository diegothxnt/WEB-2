document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/api/users/me", {
      credentials: "include"
    });

    if (res.ok) {
      window.location.href = "home.html";
    }
  } catch (error) {
    console.log("No hay sesion activa");
  }
});
