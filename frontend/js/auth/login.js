/**
 * @file js/auth/login.js
 * Maneja el formulario de inicio de sesión.
 */

const DASHBOARD_URL = '/pages/dashboard.html';
const SESSION_URL   = '/api/users/me';
const LOGIN_URL     = '/api/auth/login';

document.addEventListener('DOMContentLoaded', () => {

    /* ── Redirigir si ya hay sesión activa ───────────────────── */
    fetch(SESSION_URL, { credentials: 'include' })
        .then(res => { if (res.ok) window.location.replace(DASHBOARD_URL); })
        .catch(() => { /* sin sesión, continuar */ });

    /* ── Referencias al DOM ───────────────────────────────────── */
    const form          = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const visibleCheck  = document.getElementById('visible');
    const errorBox      = document.getElementById('loginError');
    const errorMsg      = document.getElementById('loginErrorMsg');
    const submitBtn     = document.getElementById('submitBtn');

    /* ── Ver / ocultar contraseña ─────────────────────────────── */
    visibleCheck.addEventListener('change', () => {
        passwordInput.type = visibleCheck.checked ? 'text' : 'password';
    });

    /* ── Helpers ──────────────────────────────────────────────── */
    const showError = (msg) => {
        errorMsg.textContent = msg;
        errorBox.classList.add('visible');
    };

    const clearError = () => errorBox.classList.remove('visible');

    const setLoading = (loading) => {
        submitBtn.disabled    = loading;
        submitBtn.textContent = loading ? 'Verificando...' : 'Acceder al Sistema';
    };

    /* ── Submit ───────────────────────────────────────────────── */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const usuario    = usernameInput.value.trim();
        const contrasena = passwordInput.value.trim();

        if (!usuario || !contrasena) {
            showError('Por favor completa todos los campos.');
            return;
        }

        setLoading(true);

        try {
            const res  = await fetch(LOGIN_URL, {
                method:      'POST',
                headers:     { 'Content-Type': 'application/json' },
                credentials: 'include',
                body:        JSON.stringify({ usuario, contrasena })
            });

            const data = await res.json();

            if (res.ok) {
                window.location.href = DASHBOARD_URL;
            } else {
                showError(data.error || 'Usuario o contraseña incorrectos.');
                passwordInput.value = '';
                setLoading(false);
            }
        } catch {
            showError('Error de conexión. Verifica tu red e intenta de nuevo.');
            setLoading(false);
        }
    });

});
