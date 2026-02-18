// Script de home.html movido aquí por CSP
async function verificarAcceso() {
    const respuesta = await fetch("/api/users/me", {
        credentials: "include"
    });

    if (!respuesta.ok) {
        window.location.href = "login.html";
        return;
    }

    const data = await respuesta.json();
    document.getElementById("welcomeText").innerText =
        `Bienvenido ${data.user.usuario}`;
}

document.addEventListener("DOMContentLoaded", () => {
    verificarAcceso();
    document.getElementById("logoutBtn").addEventListener("click", async (e) => {
        e.preventDefault();
        await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include"
        });
        window.location.href = "login.html";
    });

    // Verificar sesión cada 10 segundos
    setInterval(async () => {
        const res = await fetch("/api/users/me", { credentials: "include" });
        if (!res.ok) {
            window.location.href = "login.html";
        }
    }, 10000);
});
