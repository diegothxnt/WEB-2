/**
 * @file js/gestion/gestion.js
 * Panel de gestión / portal del estudiante con vistas reales.
 */

import { toProcess, ApiError } from "/js/shared/api.js";
import { getSessionUser }      from "/js/shared/auth.js";

const LOGIN_URL  = "/pages/auth/login.html";
const LOGOUT_URL = "/api/auth/logout";

// ─── Configuración de módulos por perfil ──────────────────────
const MODULOS_ADMIN = [
    { id: "prestamos",     label: "Préstamos",         icon: "/assets/icons/icon-prestamos.svg",      atx: 10  },
    { id: "devoluciones",  label: "Devoluciones",       icon: "/assets/icons/icon-devoluciones.svg",   atx: 21  },
    { id: "inventario",    label: "Inventario",          icon: "/assets/icons/icon-inventario.svg",     atx: 30  },
    { id: "estado",        label: "Estado de Equipos",  icon: "/assets/icons/icon-estado-equipos.svg", atx: 40  },
    { id: "ubicacion",     label: "Ubicación",           icon: "/assets/icons/icon-ubicacion.svg",      atx: 50  },
    { id: "amonestaciones",label: "Amonestaciones",      icon: "/assets/icons/icon-alerta.svg",         atx: 66  },
    { id: "notificaciones",label: "Notificaciones",       icon: "/assets/icons/icon-notificaciones.svg", atx: 60  },
    { id: "reportes",      label: "Reportes",             icon: "/assets/icons/icon-reportes.svg",       href: "../reportes/reportes.html" }
];

const MODULOS_HEAD_ADMIN = [
    ...MODULOS_ADMIN,
    { id: "gestion-usuarios", label: "Gestión de Usuarios", icon: "/assets/icons/icon-usuario.svg", href: "../admin-usuarios/admin-usuarios.html" }
];

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

// ─── Helpers de render ────────────────────────────────────────
function fmtFecha(ts) {
    if (!ts) return "—";
    return new Date(ts).toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" });
}

function fmtMoneda(n) {
    return `$${Number(n).toFixed(2)}`;
}

function itemsChips(items) {
    if (!Array.isArray(items)) return "—";
    return `<div class="items-list">${items.map(it =>
        `<span class="item-chip">${it.item ?? it.nombre} ×${it.cantidad}</span>`
    ).join("")}</div>`;
}

function badgeEstado(estado) {
    const map = {
        operativo:       "ok",
        solvente:        "ok",
        "en reparacion": "warn",
        dañado:          "warn",
        insolvente:      "danger",
        extraviado:      "danger"
    };
    const tipo = map[estado?.toLowerCase()] ?? "neutral";
    return `<span class="badge badge--${tipo}">${estado ?? "—"}</span>`;
}

// ─── Vistas por módulo ────────────────────────────────────────

const VISTAS = {

    // ── Préstamos (admin) ──────────────────────────────────────
    prestamos(data) {
        if (!data?.length) return `<p class="view-empty">No hay préstamos registrados.</p>`;
        const filas = data.map(r => `
            <tr>
                <td>${r.id_movimiento}</td>
                <td>${r.solicitante}<br><small class="view-empty">${r.cedula}</small></td>
                <td>${r.periodo}</td>
                <td>${fmtFecha(r.fecha)}</td>
                <td>${fmtFecha(r.fecha_fin)}</td>
                <td>${itemsChips(r.items)}</td>
                <td>
                    <button class="btn-action btn-action--primary btn-anular-prestamo" data-id="${r.id_movimiento}">Anular</button>
                    <button class="btn-action btn-modificar-fecha" data-id="${r.id_movimiento}" data-fecha="${r.fecha_fin ?? ''}">Cambiar fecha</button>
                </td>
            </tr>`).join("");
        return `
            <div class="view-toolbar">
                <h2>Préstamos</h2>
            </div>
            <div class="table-scroll">
                <table class="data-table">
                    <thead><tr>
                        <th>#</th><th>Solicitante</th><th>Período</th>
                        <th>Fecha</th><th>Entrega</th><th>Ítems</th><th>Acciones</th>
                    </tr></thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>`;
    },

    // ── Devoluciones (admin) ───────────────────────────────────
    devoluciones(data) {
        if (!data?.length) return `<p class="view-empty">No hay devoluciones registradas.</p>`;
        const filas = data.map(r => `
            <tr>
                <td>${r.id_movimiento}</td>
                <td>${r.estudiante}<br><small class="view-empty">${r.cedula}</small></td>
                <td>${r.periodo}</td>
                <td>${fmtFecha(r.fecha_devolucion)}</td>
                <td>${itemsChips(r.items)}</td>
            </tr>`).join("");
        return `
            <div class="view-toolbar"><h2>Devoluciones</h2></div>
            <div class="table-scroll">
                <table class="data-table">
                    <thead><tr>
                        <th>#</th><th>Estudiante</th><th>Período</th>
                        <th>Fecha devolución</th><th>Ítems</th>
                    </tr></thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>`;
    },

    // ── Inventario ─────────────────────────────────────────────
    inventario(data) {
        if (!data?.length) return `<p class="view-empty">Sin registros de inventario.</p>`;
        const filas = data.map(r => `
            <tr>
                <td>${r.item}</td>
                <td>${r.categoria}</td>
                <td>${r.ubicacion}</td>
                <td><strong>${r.cantidad}</strong></td>
                <td>${badgeEstado(r.estado)}</td>
                <td>
                    <button class="btn-action btn-action--primary btn-editar-inventario" data-id="${r.id_inventario}">Editar</button>
                </td>
            </tr>`).join("");
        return `
            <div class="view-toolbar"><h2>Inventario</h2></div>
            <div class="table-scroll">
                <table class="data-table">
                    <thead><tr>
                        <th>Ítem</th><th>Categoría</th><th>Ubicación</th>
                        <th>Cantidad</th><th>Estado</th><th>Acciones</th>
                    </tr></thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>`;
    },

    // ── Estado de equipos ──────────────────────────────────────
    estado(data) {
        if (!data?.length) return `<p class="view-empty">Sin equipos registrados.</p>`;
        const filas = data.map(r => `
            <tr>
                <td>${r.nombre}</td>
                <td>${r.tipo_categoria} / ${r.categoria}</td>
                <td>${badgeEstado(r.estado)}</td>
                <td>${r.cantidad_total}</td>
                <td>${r.descripcion ?? "—"}</td>
                <td>
                    <button class="btn-action btn-action--primary btn-cambiar-estado" data-id="${r.id_item}">Cambiar</button>
                </td>
            </tr>`).join("");
        return `
            <div class="view-toolbar"><h2>Estado de Equipos</h2></div>
            <div class="table-scroll">
                <table class="data-table">
                    <thead><tr>
                        <th>Ítem</th><th>Categoría</th><th>Estado</th>
                        <th>Unidades</th><th>Descripción</th><th>Acciones</th>
                    </tr></thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>`;
    },

    // ── Ubicación ──────────────────────────────────────────────
    ubicacion(data) {
        if (!data?.length) return `<p class="view-empty">Sin ubicaciones registradas.</p>`;
        const filas = data.map(r => `
            <tr>
                <td>${r.nombre}</td>
                <td>${r.total_items}</td>
                <td>${r.total_unidades}</td>
                <td>
                    <button class="btn-action btn-action--primary btn-editar-ubicacion" data-id="${r.id_ubicacion}" data-nombre="${r.nombre}">Editar</button>
                </td>
            </tr>`).join("");
        return `
            <div class="view-toolbar"><h2>Ubicaciones</h2></div>
            <div class="table-scroll">
                <table class="data-table">
                    <thead><tr>
                        <th>Ubicación</th><th>Ítems distintos</th><th>Total unidades</th><th>Acciones</th>
                    </tr></thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>`;
    },

    // ── Amonestaciones ─────────────────────────────────────────
    amonestaciones(data) {
        if (!data?.length) return `<p class="view-empty">Sin amonestaciones registradas.</p>`;
        const filas = data.map(r => `
            <tr>
                <td>${r.id_amonestacion}</td>
                <td>${r.estudiante}<br><small class="view-empty">${r.cedula}</small></td>
                <td>${badgeEstado(r.tipo)}</td>
                <td>${r.dias_retraso > 0 ? r.dias_retraso + " día(s)" : "—"}</td>
                <td>${fmtMoneda(r.monto)}</td>
                <td>${r.pagada
                    ? `<span class="badge badge--ok">Pagada</span>`
                    : `<span class="badge badge--danger">Pendiente</span>`
                }</td>
                <td>${r.pago
                    ? (r.pago.verificado
                        ? `<span class="badge badge--ok">Verificado</span>`
                        : `<button class="btn-action btn-action--primary btn-verificar-pago"
                             data-id-pago="${r.pago.id_pago}">Verificar</button>`)
                    : "—"
                }</td>
            </tr>`).join("");
        return `
            <div class="view-toolbar"><h2>Amonestaciones</h2></div>
            <div class="table-scroll">
                <table class="data-table">
                    <thead><tr>
                        <th>#</th><th>Estudiante</th><th>Tipo</th><th>Días</th>
                        <th>Monto</th><th>Estado</th><th>Comprobante</th>
                    </tr></thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>`;
    },

    // ── Notificaciones ─────────────────────────────────────────
    notificaciones(data) {
        if (!data?.length) return `<p class="view-empty">Sin notificaciones.</p>`;
        const filas = data.map(r => `
            <tr>
                <td>${r.usuario ?? "—"}</td>
                <td>${r.mensaje}</td>
                <td>${fmtFecha(r.fecha)}</td>
                <td>${r.leida
                    ? `<span class="badge badge--neutral">Leída</span>`
                    : `<span class="badge badge--warn">Sin leer</span>`
                }</td>
            </tr>`).join("");
        return `
            <div class="view-toolbar"><h2>Notificaciones</h2></div>
            <div class="table-scroll">
                <table class="data-table">
                    <thead><tr>
                        <th>Usuario</th><th>Mensaje</th><th>Fecha</th><th>Estado</th>
                    </tr></thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>`;
    },

    // ── Portal estudiante: solicitar préstamo ──────────────────
    solicitar(data) {
        if (!data?.length) return `<p class="view-empty">No hay ítems disponibles en este momento.</p>`;
        const filas = data.map(r => `
            <tr>
                <td>${r.item}</td>
                <td>${r.categoria}</td>
                <td>${r.ubicacion}</td>
                <td>${r.cantidad}</td>
                <td>
                    <input type="number" class="form-input solicitar-cantidad"
                        min="1" max="${r.cantidad}" value="1"
                        data-id="${r.id_inventario}" style="width:70px">
                </td>
                <td>
                    <input type="checkbox" class="solicitar-check" data-id="${r.id_inventario}">
                </td>
            </tr>`).join("");
        return `
            <div class="view-toolbar"><h2>Solicitar Préstamo</h2></div>
            <form id="formSolicitar" class="view-form" style="max-width:100%">
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:16px">
                    <div>
                        <label class="form-label" for="periodoSolicitar">Período</label>
                        <select id="periodoSolicitar" class="form-select">
                            <option value="">Seleccionar...</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label" for="fechaInicioSolicitar">Fecha de inicio</label>
                        <input type="datetime-local" id="fechaInicioSolicitar" class="form-input">
                    </div>
                    <div>
                        <label class="form-label" for="fechaFinSolicitar">Fecha de entrega</label>
                        <input type="datetime-local" id="fechaFinSolicitar" class="form-input">
                    </div>
                    <div>
                        <label class="form-label" for="modalidadSolicitar">Modalidad</label>
                        <select id="modalidadSolicitar" class="form-select">
                            <option value="dias">Por días (componentes)</option>
                            <option value="reserva">Reserva de equipo</option>
                        </select>
                    </div>
                </div>
                <div class="table-scroll">
                    <table class="data-table">
                        <thead><tr>
                            <th>Ítem</th><th>Categoría</th><th>Ubicación</th>
                            <th>Disponible</th><th>Cantidad</th><th>Seleccionar</th>
                        </tr></thead>
                        <tbody>${filas}</tbody>
                    </table>
                </div>
                <div id="feedbackSolicitar" class="form-feedback"></div>
                <button type="submit" class="btn-action btn-action--primary" style="align-self:flex-start">
                    Enviar solicitud
                </button>
            </form>`;
    },

    // ── Mis préstamos ──────────────────────────────────────────
    "mis-prestamos"(data) {
        if (!data?.length) return `<p class="view-empty">No tienes préstamos registrados.</p>`;
        const filas = data.map(r => `
            <tr>
                <td>${r.periodo}</td>
                <td>${fmtFecha(r.fecha)}</td>
                <td>${fmtFecha(r.fecha_fin)}</td>
                <td>${r.modalidad}</td>
                <td>${itemsChips(r.items)}</td>
            </tr>`).join("");
        return `
            <div class="view-toolbar"><h2>Mis Préstamos</h2></div>
            <div class="table-scroll">
                <table class="data-table">
                    <thead><tr>
                        <th>Período</th><th>Fecha</th><th>Fecha entrega</th>
                        <th>Modalidad</th><th>Ítems</th>
                    </tr></thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>`;
    },

    // ── Mis devoluciones ───────────────────────────────────────
    "mis-devoluciones"(data) {
        if (!data?.length) return `<p class="view-empty">No tienes devoluciones registradas.</p>`;
        const filas = data.map(r => `
            <tr>
                <td>${r.periodo}</td>
                <td>${fmtFecha(r.fecha_devolucion)}</td>
                <td>${itemsChips(r.items)}</td>
            </tr>`).join("");
        return `
            <div class="view-toolbar"><h2>Mis Devoluciones</h2></div>
            <div class="table-scroll">
                <table class="data-table">
                    <thead><tr>
                        <th>Período</th><th>Fecha devolución</th><th>Ítems devueltos</th>
                    </tr></thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>`;
    },

    // ── Mi solvencia ───────────────────────────────────────────
    "mi-solvencia"(data) {
        if (!data?.length) return `
            <div class="view-toolbar"><h2>Mi Solvencia</h2></div>
            <p class="view-empty" style="margin-top:8px">
                <span class="badge badge--ok">Solvente</span>
                &nbsp; No tienes amonestaciones pendientes.
            </p>`;

        const filas = data.map(r => `
            <tr>
                <td>${badgeEstado(r.tipo)}</td>
                <td>${r.dias_retraso > 0 ? r.dias_retraso + " día(s)" : "—"}</td>
                <td>${fmtMoneda(r.monto)}</td>
                <td>${r.descripcion ?? "—"}</td>
                <td>${fmtFecha(r.fecha_generacion)}</td>
                <td>${r.pagada
                    ? `<span class="badge badge--ok">Pagada</span>`
                    : (r.numero_transferencia
                        ? `<span class="badge badge--warn">En revisión</span>`
                        : `<button class="btn-action btn-action--primary btn-pagar-amon"
                                data-id="${r.id_amonestacion}"
                                data-monto="${r.monto}">
                                Pagar ($${Number(r.monto).toFixed(2)})
                           </button>`)
                }</td>
            </tr>`).join("");

        return `
            <div class="view-toolbar"><h2>Mi Solvencia</h2></div>
            <div class="table-scroll">
                <table class="data-table">
                    <thead><tr>
                        <th>Tipo</th><th>Días</th><th>Monto</th>
                        <th>Descripción</th><th>Fecha</th><th>Estado</th>
                    </tr></thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>
            <div id="formPagoContainer"></div>`;
    }
};

// ─── Clase MenuItem ───────────────────────────────────────────
class MenuItem {
    constructor({ id, label, icon, atx = null, href = null }) {
        Object.assign(this, { id, label, icon, atx, href });
    }

    render(onClick) {
        const btn = document.createElement("button");
        btn.className  = "btn-menu";
        btn.dataset.id = this.id;
        btn.type       = "button";
        btn.setAttribute("aria-label", this.label);
        btn.innerHTML  = `<img src="${this.icon}" alt="" class="btn-menu__icon" aria-hidden="true">${this.label}`;

        if (this.href) {
            btn.addEventListener("click", () => { window.location.href = this.href; });
        } else {
            btn.addEventListener("click", () => onClick(this.id));
        }
        return btn;
    }
}

// ─── Clase GestionApp ─────────────────────────────────────────
class GestionApp {
    #sidebar;
    #content;
    #profile;
    #items;
    #catalogos;

    constructor(profile) {
        this.#sidebar  = document.getElementById("sidebar-menu");
        this.#content  = document.getElementById("main-content");
        this.#profile  = profile;
        this.#items    = getModulos(profile).map(m => new MenuItem(m));
        this.#catalogos = { periodos: [], ubicaciones: [], estados: [] };
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
        this.#sidebar.querySelectorAll(".btn-menu")
            .forEach(btn => btn.classList.toggle("active", btn.dataset.id === id));

        history.replaceState(null, "", `#${id}`);

        const modulo = getModulos(this.#profile).find(m => m.id === id);
        if (!modulo) return;

        this.#setContent(`<section class="view-section"><p class="view-loading">Cargando ${modulo.label}...</p></section>`);

        try {
            // solicitar (atx 100) necesita cargar períodos también
            if (id === "solicitar") {
                const [dispResp, perResp] = await Promise.all([
                    toProcess(100),
                    toProcess(106)
                ]);
                if (!dispResp || !perResp) return;
                this.#catalogos.periodos = perResp.data ?? [];
                this.#setContent(`<section class="view-section">${VISTAS.solicitar(dispResp.data)}</section>`);
                this.#hookSolicitar();
                return;
            }

            if (id === "inventario") {
                const [invResp, ubicResp] = await Promise.all([toProcess(30), toProcess(32)]);
                if (!invResp || !ubicResp) return;
                this.#catalogos.ubicaciones = ubicResp.data ?? [];
                const html = VISTAS.inventario(invResp.data);
                this.#setContent(`<section class="view-section">${html}</section>`);
                this.#hookInteractions(id);
                return;
            }

            if (id === "estado") {
                const [estadoResp, estadosResp] = await Promise.all([toProcess(40), toProcess(42)]);
                if (!estadoResp || !estadosResp) return;
                this.#catalogos.estados = estadosResp.data ?? [];
                const html = VISTAS.estado(estadoResp.data);
                this.#setContent(`<section class="view-section">${html}</section>`);
                this.#hookInteractions(id);
                return;
            }

            const response = await toProcess(modulo.atx);
            if (!response) return;

            const renderFn = VISTAS[id];
            const html = renderFn
                ? renderFn(response.data)
                : `<pre class="view-not-implemented">${JSON.stringify(response.data, null, 2)}</pre>`;

            this.#setContent(`<section class="view-section">${html}</section>`);
            this.#hookInteractions(id);

        } catch (err) {
            const esNoImpl = err instanceof ApiError && err.status === 501;
            this.#setContent(`<section class="view-section">
                <p class="view-not-implemented">
                    ${esNoImpl ? "⚙️ Esta clase de negocio aún no está implementada." : `⚠️ ${err.message}`}
                </p></section>`);
        }
    }

    // ── Hooks de interacción ─────────────────────────────────

    #hookInteractions(id) {
        if (id === "amonestaciones") this.#hookVerificarPago();
        if (id === "mi-solvencia")   this.#hookPagarAmonestacion();
        if (id === "prestamos")      this.#hookPrestamos();
        if (id === "inventario")     this.#hookInventario();
        if (id === "estado")         this.#hookEstado();
        if (id === "ubicacion")      this.#hookUbicacion();
    }

    #hookPrestamos() {
        this.#content.querySelectorAll(".btn-anular-prestamo").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id_movimiento = Number(btn.dataset.id);
                if (!window.confirm(`¿Anular el préstamo #${id_movimiento}?`)) return;
                btn.disabled = true;
                btn.textContent = "Anulando...";
                try {
                    await toProcess(12, [id_movimiento]);
                    this.#activar("prestamos");
                } catch (err) {
                    btn.disabled = false;
                    btn.textContent = `⚠ ${err.message}`;
                }
            });
        });

        this.#content.querySelectorAll(".btn-modificar-fecha").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id_movimiento = Number(btn.dataset.id);
                const actual = btn.dataset.fecha || "";
                const fecha_fin = window.prompt("Nueva fecha de entrega (YYYY-MM-DD HH:mm)", actual);
                if (!fecha_fin) return;
                try {
                    await toProcess(13, [{ id_movimiento, fecha_fin }]);
                    this.#activar("prestamos");
                } catch (err) {
                    window.alert(err.message);
                }
            });
        });
    }

    #hookInventario() {
        this.#content.querySelectorAll(".btn-editar-inventario").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id_inventario = Number(btn.dataset.id);
                const cantidad = window.prompt("Nueva cantidad", "");
                if (cantidad === null) return;
                const ubicaciones = this.#catalogos.ubicaciones.map(u => `${u.id_ubicacion}: ${u.nombre}`).join("\n");
                const id_ubicacion = window.prompt(`Nueva ubicación (ID)\n${ubicaciones}`, "");
                if (id_ubicacion === null) return;

                try {
                    await toProcess(31, [{ id_inventario, cantidad: Number(cantidad), id_ubicacion: Number(id_ubicacion) }]);
                    this.#activar("inventario");
                } catch (err) {
                    window.alert(err.message);
                }
            });
        });
    }
    #hookEstado() {
        this.#content.querySelectorAll(".btn-cambiar-estado").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id_item = Number(btn.dataset.id);
                const estados = this.#catalogos.estados.map(e => `${e.id_estado_item}: ${e.nombre}`).join("\n");
                const id_estado_item = window.prompt(`Nuevo estado (ID)\n${estados}`, "");
                if (id_estado_item === null) return;
                try {
                    await toProcess(41, [{ id_item, id_estado_item: Number(id_estado_item) }]);
                    this.#activar("estado");
                } catch (err) {
                    window.alert(err.message);
                }
            });
        });
    }

    #hookUbicacion() {
        this.#content.querySelectorAll(".btn-editar-ubicacion").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id_ubicacion = Number(btn.dataset.id);
                const nombre = window.prompt("Nuevo nombre de ubicación", btn.dataset.nombre || "");
                if (!nombre) return;
                try {
                    await toProcess(51, [{ id_ubicacion, nombre }]);
                    this.#activar("ubicacion");
                } catch (err) {
                    window.alert(err.message);
                }
            });
        });
    }

    #hookVerificarPago() {
        this.#content.querySelectorAll(".btn-verificar-pago").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id_pago = Number(btn.dataset.idPago);
                btn.disabled  = true;
                btn.textContent = "Verificando...";
                try {
                    await toProcess(67, [{ id_pago }]);
                    btn.replaceWith(document.createTextNode("✓ Verificado"));
                    this.#activar("amonestaciones");
                } catch (e) {
                    btn.disabled    = false;
                    btn.textContent = `⚠ ${e.message}`;
                }
            });
        });
    }

    #hookPagarAmonestacion() {
        this.#content.querySelectorAll(".btn-pagar-amon").forEach(btn => {
            btn.addEventListener("click", () => {
                const id  = btn.dataset.id;
                const mon = btn.dataset.monto;
                const container = document.getElementById("formPagoContainer");
                container.innerHTML = `
                    <hr class="view-divider" style="margin-top:20px">
                    <div class="view-form">
                        <h3 style="font-family:var(--font-head);color:var(--c-navy)">
                            Registrar pago — Amonestación #${id}
                        </h3>
                        <div>
                            <label class="form-label">Número de transferencia</label>
                            <input type="text" id="nroTransferencia" class="form-input"
                                placeholder="Ej: TRF-20250101-001">
                        </div>
                        <div>
                            <label class="form-label">Monto pagado</label>
                            <input type="number" id="montoPago" class="form-input"
                                value="${mon}" min="0.01" step="0.01">
                        </div>
                        <div id="feedbackPago" class="form-feedback"></div>
                        <button class="btn-action btn-action--primary" id="btnEnviarPago">
                            Enviar comprobante
                        </button>
                    </div>`;

                document.getElementById("btnEnviarPago").addEventListener("click", async () => {
                    const nro   = document.getElementById("nroTransferencia").value.trim();
                    const monto = document.getElementById("montoPago").value;
                    const fb    = document.getElementById("feedbackPago");

                    if (!nro || !monto) {
                        fb.className = "form-feedback form-feedback--error visible";
                        fb.textContent = "Completa todos los campos.";
                        return;
                    }

                    try {
                        await toProcess(105, [{ id_amonestacion: Number(id), numero_transferencia: nro, monto: Number(monto) }]);
                        fb.className   = "form-feedback form-feedback--ok visible";
                        fb.textContent = "Comprobante enviado. Queda pendiente de verificación por el administrador.";
                        document.getElementById("btnEnviarPago").disabled = true;
                    } catch (e) {
                        fb.className   = "form-feedback form-feedback--error visible";
                        fb.textContent = e.message;
                    }
                });
            });
        });
    }

    #hookSolicitar() {
        const form = document.getElementById("formSolicitar");
        if (!form) return;

        const periodoSelect = document.getElementById("periodoSolicitar");
        if (periodoSelect) {
            periodoSelect.innerHTML = `
                <option value="">Seleccionar...</option>
                ${this.#catalogos.periodos.map(p => `<option value="${p.codigo}">${p.codigo}</option>`).join("")}`;
        }

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const fb = document.getElementById("feedbackSolicitar");

            const periodo     = document.getElementById("periodoSolicitar").value;
            const fecha_inicio = document.getElementById("fechaInicioSolicitar").value;
            const fecha_fin    = document.getElementById("fechaFinSolicitar").value;
            const modalidad    = document.getElementById("modalidadSolicitar").value;

            const checks    = [...form.querySelectorAll(".solicitar-check:checked")];
            const detalles  = checks.map(c => ({
                id_inventario: Number(c.dataset.id),
                cantidad:      Number(form.querySelector(`.solicitar-cantidad[data-id="${c.dataset.id}"]`).value)
            }));

            if (!periodo || !detalles.length) {
                fb.className   = "form-feedback form-feedback--error visible";
                fb.textContent = "Selecciona un período y al menos un ítem.";
                return;
            }

            try {
                await toProcess(101, [
                    { periodo, fecha_inicio: fecha_inicio || null, fecha_fin: fecha_fin || null, modalidad },
                    detalles
                ]);
                fb.className   = "form-feedback form-feedback--ok visible";
                fb.textContent = "Solicitud enviada correctamente.";
                form.reset();
            } catch (err) {
                fb.className   = "form-feedback form-feedback--error visible";
                fb.textContent = err.message;
            }
        });
    }

    #setContent(html) {
        this.#content.innerHTML = html;
    }

    #resolveHash() {
        const hash  = window.location.hash.replace("#", "");
        const match = getModulos(this.#profile).find(m => m.id === hash && !m.href);
        if (match) this.#activar(match.id);
    }
}

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {

    const user = await getSessionUser();
    if (!user) return;

    document.getElementById("sidebar-menu").dataset.profile = user.profile;

    const usernameEl = document.getElementById("usernameText");
    if (usernameEl) usernameEl.textContent = user.usuario;

    document.getElementById("logoutBtn").addEventListener("click", async () => {
        await fetch(LOGOUT_URL, { method: "POST", credentials: "include" });
        window.location.replace(LOGIN_URL);
    });

    new GestionApp(user.profile).init();
});
