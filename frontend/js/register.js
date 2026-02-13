document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre  = document.getElementById("nombre").value.trim();
    const cedula  = document.getElementById("cedula").value.trim();
    const correo  = document.getElementById("correo").value.trim();
    const usuario = document.getElementById("regUsername").value.trim();
    const contrasena = document.getElementById("regPassword").value.trim();

    if (!nombre || !cedula || !correo || !usuario || !contrasena) {
        alert("Completa todos los campos.");
        return;
    }

    try {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, cedula, correo, usuario, contrasena })
        });

        const data = await res.json();

        if (res.ok) {
            alert("Usuario registrado con éxito. Ahora puedes iniciar sesión.");
            window.location.href = "login.html";
        } else {
            alert("Error al registrar: " + (data.error || "Verifica la información"));
        }
    } catch (err) {
        alert("Error al conectar con el servidor.");
        console.error(err);
    }
});
