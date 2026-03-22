/**
 * @file js/dashboard.js
 * Lógica del panel principal (dashboard.html).
 */

const LOGIN_URL    = '/pages/auth/login.html';
const SESSION_URL  = '/api/users/me';
const LOGOUT_URL   = '/api/auth/logout';
const SESSION_POLL = 60_000; // ms

async function verificarSesion() {
    const res = await fetch(SESSION_URL, { credentials: 'include' });
    if (!res.ok) {
        window.location.replace(LOGIN_URL);
        return null;
    }
    return res.json();
}

document.addEventListener('DOMContentLoaded', async () => {

    const data = await verificarSesion();
    if (!data) return;

    /* Mostrar nombre de usuario */
    const usernameEl = document.getElementById('usernameText');
    if (usernameEl) usernameEl.textContent = data.user?.usuario ?? 'Usuario';

    /* Logout */
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await fetch(LOGOUT_URL, { method: 'POST', credentials: 'include' });
        window.location.replace(LOGIN_URL);
    });

    /* Revalidar sesión periódicamente */
    setInterval(async () => {
        const res = await fetch(SESSION_URL, { credentials: 'include' });
        if (!res.ok) window.location.replace(LOGIN_URL);
    }, SESSION_POLL);

});
