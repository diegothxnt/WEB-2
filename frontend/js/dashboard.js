/**
 * @file js/dashboard.js
 * Panel principal. Renderiza módulos según el perfil del usuario.
 * Muestra banner si fue redirigido con ?error=forbidden.
 */

import { getSessionUser, DASHBOARD_MODULES } from "/js/shared/auth.js";

const LOGIN_URL    = "/pages/auth/login.html";
const LOGOUT_URL   = "/api/auth/logout";
const SESSION_URL  = "/api/users/me";
const SESSION_POLL = 60_000;

// ─── Etiquetas legibles por perfil ───────────────────────────────
const PROFILE_LABELS = {
    head_admin: "Administrador Jefe",
    admin:      "Administrador",
    estudiante: "Estudiante"
};

const SECTION_LABELS = {
    head_admin: "Módulos del sistema",
    admin:      "Módulos del sistema",
    estudiante: "Tu portal"
};

// ─── Render de tarjetas ───────────────────────────────────────────
function renderModules(profile) {
    const grid    = document.getElementById("modulesGrid");
    const label   = document.getElementById("sectionLabel");
    const modules = DASHBOARD_MODULES[profile] ?? DASHBOARD_MODULES.estudiante;

    if (label) label.textContent = SECTION_LABELS[profile] ?? "Módulos";

    grid.innerHTML = modules.map((m, i) => `
        <a href="${m.href}" class="module-card" style="animation-delay:${(i + 1) * 0.05}s">
            <div class="module-card__icon-wrap">
                <img src="${m.icon}" alt="" class="module-card__icon" aria-hidden="true">
            </div>
            <h3 class="module-card__title">${m.label}</h3>
            <p class="module-card__desc">${m.desc}</p>
            <span class="module-card__arrow">Ir al módulo →</span>
        </a>
    `).join("");
}

// ─── Banner de acceso denegado ────────────────────────────────────
function checkForbiddenRedirect() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "forbidden") {
        const banner = document.getElementById("alertBanner");
        if (banner) banner.hidden = false;
        // Limpiar el parámetro de la URL sin recargar
        history.replaceState(null, "", window.location.pathname);
    }
}

// ─── Init ─────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {

    checkForbiddenRedirect();

    const user = await getSessionUser();
    if (!user) return; // getSessionUser redirige al login si no hay sesión

    // Mostrar nombre y rol en el header
    const usernameEl = document.getElementById("usernameText");
    if (usernameEl) {
        usernameEl.textContent = `${user.usuario} (${PROFILE_LABELS[user.profile] ?? user.profile})`;
    }

    renderModules(user.profile);

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", async () => {
        await fetch(LOGOUT_URL, { method: "POST", credentials: "include" });
        window.location.replace(LOGIN_URL);
    });

    // Revalidar sesión periódicamente
    setInterval(async () => {
        const res = await fetch(SESSION_URL, { credentials: "include" });
        if (!res.ok) window.location.replace(LOGIN_URL);
    }, SESSION_POLL);

});
