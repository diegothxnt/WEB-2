/**
 * @file js/gestion/gestion.js
 * Panel de gestión / portal del estudiante.
 * El sidebar y los ATX usados varían según el perfil del usuario.
 *
 * Acceso:  admin, head_admin, estudiante  (todos los usuarios autenticados)
 * La diferencia está en qué opciones aparecen y qué ATX se llama al activarlas.
 */

import { toProcess, ApiError } from "/js/shared/api.js";
import { getSessionUser }      from "/js/shared/auth.js";

const LOGIN_URL  = "/pages/auth/login.html";
const LOGOUT_URL = "/api/auth/logout";

// ─── Sidebar: admin / head_admin ─────────────────────────────────
const MODULOS_ADMIN = [
    { id: "prestamos",     label: "Préstamos",          icon: "/assets/icons/icon-prestamos.svg",      atx: 10  },
    { id: "devoluciones",  label: "Devoluciones",        icon: "/assets/icons/icon-devoluciones.svg",   atx: 21  },
    { id: "inventario",    label: "Inventario",           icon: "/assets/icons/icon-inventario.svg",     atx: 30  },
    { id: "estado",        label: "Estado de Equipos",   icon: "/assets/icons/icon-estado-equipos.svg", atx: 40  },
    { id: "ubicacion",     label: "Ubicación",            icon: "/assets/icons/icon-ubicacion.svg",      atx: 50  },
    { id: "amonestaciones",label: "Amonestaciones",       icon: "/assets/icons/icon-alerta.svg",         atx: 66  },
    { id: "notificaciones",label: "Notificaciones",        icon: "/assets/icons/icon-notificaciones.svg", atx: 60  },
    { id: "reportes",      label: "Reportes",              icon: "/assets/icons/icon-reportes.svg",       href: "../reportes/reportes.html" }
];

// head_admin ve todo lo de admin + acceso a gestión de usuarios
const MODULOS_HEAD_ADMIN = [
    ...MODULOS_ADMIN,
    { id: "gestion-usuarios", label: "Gestión de Usuarios", icon: "/assets/icons/icon-usuario.svg", href: "../admin-usuarios/admin-usuarios.html" }
];

// ─── Sidebar: estudiante ─────────────────────────────────────────
const MODULOS_ESTUDIANTE = [
    { id: "solicitar",       label: "Solicitar Préstamo", icon: "/assets/icons/icon-prestamos.svg",      atx: 100 },
    { id: "mis-prestamos",   label: "Mis Préstamos",       icon: "/assets/icons/icon-inventario.svg",     atx: 102 },
    { id: "mis-devoluciones",label: "Mis Devoluciones",    icon: "/assets/icons/icon-devoluciones.svg",   atx: 103 },
    { id: "mi-solvencia",    label: "Mi Solvencia",         icon: "/assets/icons/icon-solvencia.svg",      atx: 104 },
    { id: "notificaciones",  label: "Notificaciones",        icon: "/assets/icons/icon-notificaciones.svg", atx: 60  }
];

function getModulos(profile) {
    if (profile === "head_admin") return MODULOS_HEAD_ADMIN;
    if (profile === "admin")      return MODULOS_ADMIN;
    return MODULOS_ESTUDIANTE;
}

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
        btn.innerHTML  = `
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

    constructor(profile) {
        this.#sidebar = document.getElementById("sidebar-menu");
        this.#content = document.getElementById("main-content");
        this.#items   = getModulos(profile).map(m => new MenuItem(m));

        // Adaptar título de la página según el perfil
        if (profile === "estudiante") {
            document.title    = "Portal — Laboratorio de Electrónica";
            const lbl = this.#sidebar.previousElementSibling;
            if (lbl?.classList.contains("sidebar-label")) lbl.textContent = "Mi Portal";
        }
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

        const modulo = getModulos(this.#getCurrentProfile()).find(m => m.id === id);
        if (!modulo) return;

        this.#renderCargando(modulo.label);

        try {
            const response = await toProcess(modulo.atx);
            if (response === null) return;
            this.#renderVista(modulo, response.data);
        } catch (err) {
            this.#renderError(modulo.label, err);
        }
    }

    // Perfil almacenado en el atributo data del sidebar para evitar re-fetch
    #getCurrentProfile() {
        return this.#sidebar.dataset.profile ?? "estudiante";
    }

    // ── Vistas ──────────────────────────────────────────────────

    #renderCargando(label) {
        this.#content.innerHTML = `
            <section class="view-section">
                <h2>${label}</h2><hr class="view-divider">
                <p class="view-loading">Cargando...</p>
            </section>`;
    }

    #renderVista(modulo, data) {
        const preview = data
            ? `<pre class="view-data-preview">${JSON.stringify(data, null, 2)}</pre>`
            : `<p class="view-empty">No hay datos disponibles.</p>`;

        this.#content.innerHTML = `
            <section class="view-section" aria-labelledby="view-title-${modulo.id}">
                <h2 id="view-title-${modulo.id}">${modulo.label}</h2>
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
                        ? "Esta clase de negocio aún no está implementada."
                        : `Error: ${err.message}`}
                </p>
            </section>`;
    }

    #resolveHash() {
        const hash  = window.location.hash.replace("#", "");
        const match = getModulos(this.#getCurrentProfile()).find(m => m.id === hash && !m.href);
        if (match) this.#activar(match.id);
    }
}

// ─── Init ─────────────────────────────────────────────────────────
// gestion.html es accesible para todos los perfiles autenticados,
// pero el contenido varía según el rol.
document.addEventListener("DOMContentLoaded", async () => {

    const user = await getSessionUser();
    if (!user) return; // redirige al login

    // Guardar perfil en el sidebar para acceso sin re-fetch
    document.getElementById("sidebar-menu").dataset.profile = user.profile;

    const usernameEl = document.getElementById("usernameText");
    if (usernameEl) usernameEl.textContent = user.usuario;

    document.getElementById("logoutBtn").addEventListener("click", async () => {
        await fetch(LOGOUT_URL, { method: "POST", credentials: "include" });
        window.location.replace(LOGIN_URL);
    });

    new GestionApp(user.profile).init();

});
