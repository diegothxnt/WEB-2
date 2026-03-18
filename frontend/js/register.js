document.getElementById("registerForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const data = {
        nombre: document.getElementById("nombre").value,
        cedula: document.getElementById("cedula").value,
        correo: document.getElementById("correo").value,
        usuario: document.getElementById("regUsername").value,
        contrasena: document.getElementById("regPassword").value
    };

    try {
        const respuesta = await fetch("http://localhost:4000/toProcess", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clase: "Auth", metodo: "register", data })
        });

        const resultado = await respuesta.json();
        if (resultado.success || resultado.user) {
            window.location.href = "login.html"; // Salto automático al login
        } else {
            alert("Error: " + (resultado.error || "No se pudo registrar"));
        }
    } catch (error) {
        console.error("Error:", error);
    }
});