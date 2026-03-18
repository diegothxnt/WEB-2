document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const usuario = document.getElementById("username").value;
    const contrasena = document.getElementById("password").value;

    try {
        const respuesta = await fetch("http://localhost:4000/toProcess", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", 
            body: JSON.stringify({ clase: "Auth", metodo: "login", data: { usuario, contrasena } })
        });

        const resultado = await respuesta.json();
        if (resultado.success) {
            window.location.href = "home.html"; // Redirección instantánea
        } else {
            alert("Error: " + resultado.error); // Solo alert en caso de error real
        }
    } catch (error) {
        console.error("Error:", error);
    }
});

// Ver clave
document.getElementById('visible').addEventListener('change', function() {
    document.getElementById('password').type = this.checked ? 'text' : 'password';
});