/**
 * @file js/reportes/reportes.js
 * Panel de reportes.
 *
 * Acceso: admin, head_admin
 * Si un estudiante navega directamente a esta URL, es redirigido
 * al dashboard con error=forbidden.
 */

import { toProcess, ApiError } from "/js/shared/api.js";
import { guardPage }           from "/js/shared/auth.js";

const LOGIN_URL  = "/pages/auth/login.html";
const LOGOUT_URL = "/api/auth/logout";

// ─── Opciones de reporte ──────────────────────────────────────────
const REPORTES = [
    { id: "solvencia",    label: "Solvencia",          icon: "/assets/icons/icon-solvencia.svg",    atx: 70 },
    { id: "morosos",      label: "Listado de Morosos", icon: "/assets/icons/icon-morosos.svg",      atx: 71 },
    { id: "estadisticas", label: "Estadísticas",        icon: "/assets/icons/icon-estadisticas.svg", atx: 72 }
];

// ─── Clase OpcionReporte ──────────────────────────────────────────
class OpcionReporte {
    constructor({ id, label, icon, atx }) {
        Object.assign(this, { id, label, icon, atx });
    }

    render(onClick) {
        const btn = document.createElement("button");
        btn.className  = "btn-menu";
        btn.dataset.id = this.id;
        btn.type       = "button";
        btn.setAttribute("aria-label", this.label);
        btn.innerHTML  = `
            <img src="${this.icon}" alt="" class="btn-menu__icon" aria-hidden="true">
            ${this.label}`;
        btn.addEventListener("click", () => onClick(this.id));
        return btn;
    }
}

// ─── Clase ReportesApp ────────────────────────────────────────────
class ReportesApp {
    #sidebar;
    #content;
    #opciones;

    constructor() {
        this.#sidebar  = document.getElementById("sidebar-reportes");
        this.#content  = document.getElementById("main-content");
        this.#opciones = REPORTES.map(r => new OpcionReporte(r));
    }

    init() {
        this.#renderSidebar();
        this.#resolveHash();
    }

    #renderSidebar() {
        this.#opciones.forEach(op => {
            this.#sidebar.appendChild(op.render(id => this.#activar(id)));
        });
    }

    async #activar(id) {
        this.#sidebar.querySelectorAll(".btn-menu").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.id === id);
        });
        history.replaceState(null, "", `#${id}`);

        const reporte = REPORTES.find(r => r.id === id);
        if (!reporte) return;

        this.#renderCargando(reporte.label);

        try {
            const response = await toProcess(reporte.atx);
            if (response === null) return;
            this.#renderVista(reporte, response.data);
        } catch (err) {
            this.#renderError(reporte.label, err);
        }
    }
    // ── Vistas ──────────────────────────────────────────────────
    #renderCargando(label) {
        this.#content.innerHTML = `
            <section class="view-section">
                <h2>${label}</h2><hr class="view-divider">
                <p class="view-loading">Cargando...</p>
            </section>`;
    }

    #renderVista(reporte, data) {
        const preview = data
            ? `<pre class="view-data-preview">${JSON.stringify(data, null, 2)}</pre>`
            : `<p class="view-empty">No hay datos disponibles.</p>`;

        this.#content.innerHTML = `
            <section class="view-section" aria-labelledby="view-title-${reporte.id}">
                <h2 id="view-title-${reporte.id}">${reporte.label}</h2>
                <hr class="view-divider">${preview}
            </section>`;
    }

    #renderError(label, err) {
        const esNoImplementado = err instanceof ApiError && err.status === 501;
        this.#content.innerHTML = `
            <section class="view-section">
                <h2>${label}</h2><hr class="view-divider">
                <p class="view-not-implemented">
                    ${esNoImplementado
                        ? "⚙️ Esta clase de negocio aún no está implementada."
                        : `⚠️ Error: ${err.message}`}
                </p>
            </section>`;
    }

    #resolveHash() {
        const hash  = window.location.hash.replace("#", "");
        const match = REPORTES.find(r => r.id === hash);
        if (match) this.#activar(match.id);
    }
}

// ─── Guard + Init ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {

    // Solo admin y head_admin. Estudiante → dashboard con error=forbidden.
    const user = await guardPage(["admin", "head_admin"]);
    if (!user) return;

    const usernameEl = document.getElementById("usernameText");
    if (usernameEl) usernameEl.textContent = user.usuario;

    document.getElementById("logoutBtn").addEventListener("click", async () => {
        await fetch(LOGOUT_URL, { method: "POST", credentials: "include" });
        window.location.replace(LOGIN_URL);
    });

    new ReportesApp().init();

});
