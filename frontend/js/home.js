document.addEventListener("DOMContentLoaded", async () => {
    try {
        const respuesta = await fetch("http://localhost:4000/toProcess", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ clase: "Usuario", metodo: "listar" })
        });

        const resultado = await respuesta.json();
        if (!resultado.success) {
            window.location.href = "login.html"; // Si no hay sesión, rebota al login
        }
    } catch (error) {
        window.location.href = "login.html";
    }
});

document.getElementById("logoutBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    try {
        await fetch("http://localhost:4000/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
        window.location.href = "login.html"; // Salida instantánea
    }
});