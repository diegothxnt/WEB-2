/**
 * @file js/gestion/gestion.js
 * Panel de gestión del laboratorio.
 */

import { toProcess, ApiError } from "/js/shared/api.js";

const LOGIN_URL   = "/pages/auth/login.html";
const SESSION_URL = "/api/users/me";
const LOGOUT_URL  = "/api/auth/logout";

// ─── Módulos del sidebar ─────────────────────────────────────────
const MODULOS = [
    { id: "prestamos",      label: "Préstamos",         icon: "/assets/icons/icon-prestamos.svg",      atx: 10 },
    { id: "devoluciones",   label: "Devoluciones",       icon: "/assets/icons/icon-devoluciones.svg",   atx: 20 },
    { id: "estado",         label: "Estado de Equipos",  icon: "/assets/icons/icon-estado-equipos.svg", atx: 40 },
    { id: "inventario",     label: "Inventario",          icon: "/assets/icons/icon-inventario.svg",     atx: 30 },
    { id: "notificaciones", label: "Notificaciones",      icon: "/assets/icons/icon-notificaciones.svg", atx: 60 },
    { id: "ubicacion",      label: "Ubicación",           icon: "/assets/icons/icon-ubicacion.svg",      atx: 50 },
    {
        id:    "reportes",
        label: "Reportes",
        icon:  "/assets/icons/icon-reportes.svg",
        href:  "../reportes/reportes.html"   // navega a otra página, sin atx
    }
];

// ─── Clase MenuItem ───────────────────────────────────────────────
class MenuItem {
    constructor({ id, label, icon, atx = null, href = null }) {
        this.id    = id;
        this.label = label;
        this.icon  = icon;
        this.atx   = atx;
        this.href  = href;
    }

    render(onClick) {
        const btn = document.createElement("button");
        btn.className  = "btn-menu";
        btn.dataset.id = this.id;
        btn.type       = "button";
        btn.setAttribute("aria-label", this.label);

        btn.innerHTML = `
            <img src="${this.icon}" alt="" class="btn-menu__icon" aria-hidden="true">
            ${this.label}
        `;

        if (this.href) {
            btn.addEventListener("click", () => { window.location.href = this.href; });
        } else {
            btn.addEventListener("click", () => onClick(this.id));
        }

        return btn;
    }
}

// ─── Clase GestionApp ─────────────────────────────────────────────
class GestionApp {
    #sidebar;
    #content;
    #items;

    constructor() {
        this.#sidebar = document.getElementById("sidebar-menu");
        this.#content = document.getElementById("main-content");
        this.#items   = MODULOS.map(m => new MenuItem(m));
    }

    init() {
        this.#renderSidebar();
        this.#resolveHash();
    }

    #renderSidebar() {
        this.#items.forEach(item => {
            this.#sidebar.appendChild(item.render(id => this.#activar(id)));
        });
    }

    async #activar(id) {
        this.#sidebar.querySelectorAll(".btn-menu").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.id === id);
        });

        history.replaceState(null, "", `#${id}`);

        const modulo = MODULOS.find(m => m.id === id);
        if (!modulo) return;

        this.#renderCargando(modulo.label);

        try {
            const response = await toProcess(modulo.atx);
            if (response === null) return; // sesión expirada, ya redirigido

            this.#renderVista(modulo, response.data);
        } catch (err) {
            this.#renderError(modulo.label, err);
        }
    }

    // ── Vistas ──────────────────────────────────────────────────

    #renderCargando(label) {
        this.#content.innerHTML = `
            <section class="view-section">
                <h2>${label}</h2>
                <hr class="view-divider">
                <p class="view-loading">Cargando...</p>
            </section>
        `;
    }

    #renderVista(modulo, data) {
        const preview = data
            ? `<pre class="view-data-preview">${JSON.stringify(data, null, 2)}</pre>`
            : `<p class="view-empty">No hay datos disponibles.</p>`;

        this.#content.innerHTML = `
            <section class="view-section" aria-labelledby="view-title-${modulo.id}">
                <h2 id="view-title-${modulo.id}">${modulo.label}</h2>
                <hr class="view-divider">
                ${preview}
            </section>
        `;
    }

    #renderError(label, err) {
        const esNoImplementado = err instanceof ApiError && err.status === 501;

        this.#content.innerHTML = `
            <section class="view-section">
                <h2>${label}</h2>
                <hr class="view-divider">
                <p class="view-not-implemented">
                    ${esNoImplementado
                        ? "Esta clase de negocio aún no está implementada."
                        : `Error al cargar: ${err.message}`
                    }
                </p>
            </section>
        `;
    }

    #resolveHash() {
        const hash  = window.location.hash.replace("#", "");
        const match = MODULOS.find(m => m.id === hash && !m.href);
        if (match) this.#activar(match.id);
    }
}

// ─── Auth guard e inicialización ──────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {

    const res = await fetch(SESSION_URL, { credentials: "include" });
    if (!res.ok) { window.location.replace(LOGIN_URL); return; }

    const data = await res.json();

    const usernameEl = document.getElementById("usernameText");
    if (usernameEl) usernameEl.textContent = data.user?.usuario ?? "Usuario";

    document.getElementById("logoutBtn").addEventListener("click", async () => {
        await fetch(LOGOUT_URL, { method: "POST", credentials: "include" });
        window.location.replace(LOGIN_URL);
    });

    new GestionApp().init();

});
