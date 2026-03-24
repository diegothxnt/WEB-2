/**
 * @file js/admin-usuarios/admin-usuarios.js
 * Gestión de usuarios y permisos — exclusivo para head_admin.
 *
 * Acceso: head_admin
 * Cualquier otro perfil → dashboard con error=forbidden.
 */

import { toProcess, ApiError } from "/js/shared/api.js";
import { guardPage }           from "/js/shared/auth.js";

const LOGIN_URL  = "/pages/auth/login.html";
const LOGOUT_URL = "/api/auth/logout";

const OPCIONES = [
    { id: "usuarios-perfiles", label: "Usuarios y Perfiles",  icon: "/assets/icons/icon-usuario.svg" },
    { id: "permisos-manuales", label: "Permisos Manuales",    icon: "/assets/icons/icon-alerta.svg"  }
];

class OpcionMenu {
    constructor({ id, label, icon }) {
        Object.assign(this, { id, label, icon });
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

class AdminUsuariosApp {
    #sidebar;
    #content;
    #opciones;

    constructor() {
        this.#sidebar  = document.getElementById("sidebar-admin-usuarios");
        this.#content  = document.getElementById("main-content");
        this.#opciones = OPCIONES.map(o => new OpcionMenu(o));
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

        if (id === "usuarios-perfiles") await this.#vistaUsuariosPerfiles();
        if (id === "permisos-manuales") await this.#vistaPermisosManales();
    }

    // ── Vista: Usuarios y Perfiles ────────────────────────────────

    async #vistaUsuariosPerfiles() {
        this.#renderCargando("Usuarios y Perfiles");
        try {
            const [usersResp, perfilesResp] = await Promise.all([
                toProcess(200),
                toProcess(203)
            ]);

            if (!usersResp || !perfilesResp) return; // sesión expirada

            this.#renderTablaUsuarios(usersResp.data, perfilesResp.data);
        } catch (err) {
            this.#renderError("Usuarios y Perfiles", err);
        }
    }

    #renderTablaUsuarios(usuarios, perfiles) {
        if (!usuarios || !perfiles) {
            this.#renderNoImplementado("Usuarios y Perfiles");
            return;
        }

        const perfilOpts = perfiles.map(p => `<option value="${p.id}">${p.nombre}</option>`).join("");

        const filas = usuarios.map(u => `
            <tr>
                <td>${u.nombre}</td>
                <td>${u.cedula}</td>
                <td>${u.usuario}</td>
                <td>
                    <select class="select-perfil" data-id-usuario="${u.id_usuario}">
                        ${perfiles.map(p => `
                            <option value="${p.id_perfil}" ${u.id_perfil === p.id_perfil ? "selected" : ""}>
                                ${p.nombre}
                            </option>`).join("")}
                    </select>
                </td>
                <td>
                    <button class="btn-guardar-perfil btn-primary-sm" data-id-usuario="${u.id_usuario}">
                        Guardar
                    </button>
                </td>
            </tr>
        `).join("");

        this.#content.innerHTML = `
            <section class="view-section" aria-labelledby="view-title-usuarios">
                <h2 id="view-title-usuarios">Usuarios y Perfiles</h2>
                <hr class="view-divider">
                <div class="table-scroll">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Nombre</th><th>Cédula</th><th>Usuario</th>
                                <th>Perfil</th><th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>${filas}</tbody>
                    </table>
                </div>
            </section>`;

        // Asignar handlers a los botones de guardar
        this.#content.querySelectorAll(".btn-guardar-perfil").forEach(btn => {
            btn.addEventListener("click", () => this.#cambiarPerfil(btn));
        });
    }

    async #cambiarPerfil(btn) {
        const id_usuario = Number(btn.dataset.idUsuario);
        const select     = this.#content.querySelector(`.select-perfil[data-id-usuario="${id_usuario}"]`);
        const id_perfil  = Number(select.value);

        btn.disabled     = true;
        btn.textContent  = "Guardando...";

        try {
            await toProcess(201, [{ id_usuario, id_perfil }]);
            btn.textContent = "✓ Guardado";
            setTimeout(() => {
                btn.disabled    = false;
                btn.textContent = "Guardar";
            }, 2000);
        } catch (err) {
            btn.textContent = `⚠ ${err.message}`;
            btn.disabled    = false;
        }
    }

    // ── Vista: Permisos Manuales ──────────────────────────────────

    async #vistaPermisosManales() {
        this.#renderCargando("Permisos Manuales");
        try {
            const resp = await toProcess(200); // listar usuarios
            if (!resp) return;
            this.#renderPermisosManales(resp.data);
        } catch (err) {
            this.#renderError("Permisos Manuales", err);
        }
    }

    #renderPermisosManales(usuarios) {
        if (!usuarios) { this.#renderNoImplementado("Permisos Manuales"); return; }

        const opts = usuarios.map(u =>
            `<option value="${u.id_usuario}">${u.nombre} (${u.usuario})</option>`
        ).join("");

        this.#content.innerHTML = `
            <section class="view-section" aria-labelledby="view-title-permisos">
                <h2 id="view-title-permisos">Permisos Manuales por Usuario</h2>
                <hr class="view-divider">
                <p class="view-empty" style="margin-bottom:16px">
                    Selecciona un usuario para gestionar sus permisos individuales (override de perfil).
                </p>
                <div class="form-group" style="max-width:320px">
                    <label class="form-label" for="selectUsuarioPermiso">Usuario</label>
                    <select id="selectUsuarioPermiso" style="width:100%;padding:10px;border:1.5px solid var(--c-border);border-radius:7px">
                        <option value="">— Seleccionar —</option>
                        ${opts}
                    </select>
                </div>
                <div id="permisosUsuarioContent"></div>
            </section>`;

        document.getElementById("selectUsuarioPermiso").addEventListener("change", async e => {
            const id_usuario = Number(e.target.value);
            if (!id_usuario) return;
            const container = document.getElementById("permisosUsuarioContent");
            container.innerHTML = `<p class="view-loading">Cargando permisos...</p>`;
            container.innerHTML = `<p class="view-not-implemented">Carga de permisos individuales pendiente de implementación en GestionUsuariosClass.</p>`;
        });
    }

    // ── Helpers ───────────────────────────────────────────────────

    #renderCargando(label) {
        this.#content.innerHTML = `
            <section class="view-section">
                <h2>${label}</h2><hr class="view-divider">
                <p class="view-loading">Cargando...</p>
            </section>`;
    }

    #renderNoImplementado(label) {
        this.#content.innerHTML = `
            <section class="view-section">
                <h2>${label}</h2><hr class="view-divider">
                <p class="view-not-implemented">Esta clase de negocio aún no está implementada.</p>
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
        const match = OPCIONES.find(o => o.id === hash);
        if (match) this.#activar(match.id);
    }
}

// ─── Guard + Init ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {

    // Solo head_admin. Cualquier otro perfil → dashboard con error=forbidden.
    const user = await guardPage(["head_admin"]);
    if (!user) return;

    const usernameEl = document.getElementById("usernameText");
    if (usernameEl) usernameEl.textContent = user.usuario;

    document.getElementById("logoutBtn").addEventListener("click", async () => {
        await fetch(LOGOUT_URL, { method: "POST", credentials: "include" });
        window.location.replace(LOGIN_URL);
    });

    new AdminUsuariosApp().init();

});
