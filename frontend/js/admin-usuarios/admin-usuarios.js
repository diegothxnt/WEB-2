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
            const container = document.getElementById("permisosUsuarioContent");
            if (!id_usuario) {
                container.innerHTML = "";
                return;
            }
            container.innerHTML = `<p class="view-loading">Cargando permisos...</p>`;
            try {
                const resp = await toProcess(206, [{ id_usuario }]);
                this.#renderOverridesUsuario(id_usuario, usuarios, resp.data);
            } catch (err) {
                container.innerHTML = `<p class="view-not-implemented">⚠ ${err.message}</p>`;
            }
        });
    }

    #renderOverridesUsuario(id_usuario, usuarios, overrides) {
        const container = document.getElementById("permisosUsuarioContent");
        const user = usuarios.find(u => Number(u.id_usuario) === Number(id_usuario));
        const filas = (overrides ?? []).map(o => `
            <tr>
                <td>${o.atx}</td>
                <td>${o.puede_ejecutar ? "Concedido" : "Revocado"}</td>
                <td>
                    <button class="btn-action btn-action--primary btn-remover-override" data-atx="${o.atx}" data-id-usuario="${id_usuario}">Eliminar</button>
                </td>
            </tr>`).join("");

        container.innerHTML = `
            <hr class="view-divider" style="margin:20px 0">
            <div class="view-form" style="max-width:680px">
                <h3 style="font-family:var(--font-head);color:var(--c-navy)">Overrides de ${user ? `${user.nombre} (${user.usuario})` : `usuario #${id_usuario}`}</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-top:12px">
                    <div>
                        <label class="form-label" for="overrideAtx">ATX</label>
                        <input type="number" id="overrideAtx" class="form-input" placeholder="Ej: 101" min="1">
                    </div>
                    <div>
                        <label class="form-label" for="overridePuedeEjecutar">Permiso</label>
                        <select id="overridePuedeEjecutar" class="form-select">
                            <option value="true">Conceder</option>
                            <option value="false">Revocar</option>
                        </select>
                    </div>
                </div>
                <div style="margin-top:12px">
                    <button class="btn-action btn-action--primary" id="btnGuardarOverride">Guardar override</button>
                </div>
                <div id="feedbackOverride" class="form-feedback"></div>
            </div>
            <div class="table-scroll" style="margin-top:16px">
                <table class="data-table">
                    <thead><tr><th>ATX</th><th>Estado</th><th>Acción</th></tr></thead>
                    <tbody>${filas || `<tr><td colspan="3">Sin overrides manuales.</td></tr>`}</tbody>
                </table>
            </div>`;

        document.getElementById("btnGuardarOverride").addEventListener("click", async () => {
            const atx = Number(document.getElementById("overrideAtx").value);
            const puede_ejecutar = document.getElementById("overridePuedeEjecutar").value === "true";
            const fb = document.getElementById("feedbackOverride");
            if (!atx) {
                fb.className = "form-feedback form-feedback--error visible";
                fb.textContent = "Ingresa un ATX válido.";
                return;
            }
            try {
                await toProcess(204, [{ id_usuario, atx, puede_ejecutar }]);
                fb.className = "form-feedback form-feedback--ok visible";
                fb.textContent = "Override guardado.";
                const resp = await toProcess(206, [{ id_usuario }]);
                this.#renderOverridesUsuario(id_usuario, usuarios, resp.data);
            } catch (err) {
                fb.className = "form-feedback form-feedback--error visible";
                fb.textContent = err.message;
            }
        });

        container.querySelectorAll(".btn-remover-override").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id_usuario = Number(btn.dataset.idUsuario);
                const atx = Number(btn.dataset.atx);
                if (!window.confirm(`¿Eliminar el override ATX ${atx}?`)) return;
                try {
                    await toProcess(205, [{ id_usuario, atx }]);
                    const resp = await toProcess(206, [{ id_usuario }]);
                    this.#renderOverridesUsuario(id_usuario, usuarios, resp.data);
                } catch (err) {
                    window.alert(err.message);
                }
            });
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
