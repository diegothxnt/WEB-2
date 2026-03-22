/**
 * @file js/auth/register.js
 * Maneja el formulario de registro de usuario.
 */

const LOGIN_URL    = '/pages/auth/login.html';
const REGISTER_URL = '/api/auth/register';

document.addEventListener('DOMContentLoaded', () => {

    const form      = document.getElementById('registerForm');
    const errorBox  = document.getElementById('registerError');
    const errorMsg  = document.getElementById('registerErrorMsg');
    const submitBtn = document.getElementById('submitBtn');

    const showError = (msg) => {
        errorMsg.textContent = msg;
        errorBox.classList.add('visible');
    };

    const clearError = () => errorBox.classList.remove('visible');

    const setLoading = (loading) => {
        submitBtn.disabled    = loading;
        submitBtn.textContent = loading ? 'Registrando...' : 'Crear cuenta';
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const nombre     = document.getElementById('nombre').value.trim();
        const cedula     = document.getElementById('cedula').value.trim();
        const correo     = document.getElementById('correo').value.trim();
        const usuario    = document.getElementById('regUsername').value.trim();
        const contrasena = document.getElementById('regPassword').value.trim();

        if (!nombre || !cedula || !correo || !usuario || !contrasena) {
            showError('Por favor completa todos los campos.');
            return;
        }

        setLoading(true);

        try {
            const res  = await fetch(REGISTER_URL, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ nombre, cedula, correo, usuario, contrasena })
            });

            const data = await res.json();

            if (res.ok) {
                /* Pasar parámetro para que login muestre mensaje de éxito */
                window.location.href = `${LOGIN_URL}?registered=1`;
            } else {
                showError(data.error || 'No se pudo completar el registro. Verifica la información.');
                setLoading(false);
            }
        } catch {
            showError('Error de conexión. Verifica tu red e intenta de nuevo.');
            setLoading(false);
        }
    });

});
