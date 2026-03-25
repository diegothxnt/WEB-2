/**
 * @file js/reportes/reportes.js
 * Acceso: admin, head_admin
 */

import { toProcess, ApiError } from "/js/shared/api.js";
import { guardPage }           from "/js/shared/auth.js";

const LOGIN_URL  = "/pages/auth/login.html";
const LOGOUT_URL = "/api/auth/logout";

const REPORTES = [
    { id: "solvencia",    label: "Solvencia",          icon: "/assets/icons/icon-solvencia.svg",    atx: 70 },
    { id: "morosos",      label: "Listado de Morosos", icon: "/assets/icons/icon-morosos.svg",      atx: 71 },
    { id: "estadisticas", label: "Estadísticas",        icon: "/assets/icons/icon-estadisticas.svg", atx: 72 }
];

function fmtFecha(ts) {
    if (!ts) return "—";
    return new Date(ts).toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" });
}

function badgeEstado(estado) {
    const map = { solvente: "ok", insolvente: "danger" };
    return `<span class="badge badge--${map[estado] ?? "neutral"}">${estado}</span>`;
}

// ─── Vistas ───────────────────────────────────────────────────

function vistaSolvencia(data) {
    if (!data?.length) return `<p class="view-empty">Sin datos de solvencia.</p>`;
    const filas = data.map(r => `
        <tr>
            <td>${r.nombre}</td>
            <td>${r.cedula}</td>
            <td>${r.correo}</td>
            <td>${badgeEstado(r.estado)}</td>
            <td>${r.prestamos_pendientes}</td>
        </tr>`).join("");
    return `
        <div class="view-toolbar"><h2>Solvencia</h2></div>
        <div class="table-scroll">
            <table class="data-table">
                <thead><tr>
                    <th>Nombre</th><th>Cédula</th><th>Correo</th>
                    <th>Estado</th><th>Préstamos pendientes</th>
                </tr></thead>
                <tbody>${filas}</tbody>
            </table>
        </div>`;
}

function vistaMorosos(data) {
    if (!data?.length) return `
        <div class="view-toolbar"><h2>Listado de Morosos</h2></div>
        <p class="view-empty"><span class="badge badge--ok">Sin morosos</span> &nbsp; No hay préstamos vencidos.</p>`;

    const filas = data.map(r => `
        <tr>
            <td>${r.nombre}</td>
            <td>${r.cedula}</td>
            <td>${fmtFecha(r.fecha_prestamo)}</td>
            <td>${fmtFecha(r.fecha_fin)}</td>
            <td><strong>${r.dias_retraso}</strong></td>
            <td>${r.periodo}</td>
        </tr>`).join("");
    return `
        <div class="view-toolbar"><h2>Listado de Morosos</h2></div>
        <div class="table-scroll">
            <table class="data-table">
                <thead><tr>
                    <th>Nombre</th><th>Cédula</th><th>Fecha préstamo</th>
                    <th>Fecha límite</th><th>Días de retraso</th><th>Período</th>
                </tr></thead>
                <tbody>${filas}</tbody>
            </table>
        </div>`;
}

function vistaEstadisticas(data) {
    if (!data) return `<p class="view-empty">Sin datos.</p>`;
    const items = [
        { label: "Total préstamos",          value: data.total_prestamos },
        { label: "Total devoluciones",        value: data.total_devoluciones },
        { label: "Ítems en sistema",          value: data.total_items },
        { label: "Unidades en inventario",    value: data.total_unidades },
        { label: "Usuarios activos",          value: data.usuarios_activos },
        { label: "Amonestaciones pendientes", value: data.amonestaciones_pendientes },
        { label: "Monto pendiente",           value: `$${Number(data.monto_pendiente).toFixed(2)}` }
    ];

    const tarjetas = items.map(it => `
        <div style="background:var(--c-surface);border:1.5px solid var(--c-border);
                    border-radius:var(--radius);padding:20px 24px">
            <p style="font-family:var(--font-mono);font-size:0.68rem;color:var(--c-muted);
                      text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">
                ${it.label}
            </p>
            <p style="font-family:var(--font-head);font-size:1.7rem;color:var(--c-navy)">
                ${it.value}
            </p>
        </div>`).join("");

    return `
        <div class="view-toolbar"><h2>Estadísticas del Sistema</h2></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px">
            ${tarjetas}
        </div>`;
}

// ─── Clase ───────────────────────────────────────────────────

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
        btn.innerHTML  = `<img src="${this.icon}" alt="" class="btn-menu__icon" aria-hidden="true">${this.label}`;
        btn.addEventListener("click", () => onClick(this.id));
        return btn;
    }
}

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
        this.#sidebar.innerHTML = "";
        this.#opciones.forEach(op => this.#sidebar.appendChild(op.render(id => this.#activar(id))));
        this.#resolveHash();
    }

    async #activar(id) {
        this.#sidebar.querySelectorAll(".btn-menu")
            .forEach(btn => btn.classList.toggle("active", btn.dataset.id === id));
        history.replaceState(null, "", `#${id}`);

        const rep = REPORTES.find(r => r.id === id);
        if (!rep) return;

        this.#content.innerHTML = `<section class="view-section"><p class="view-loading">Cargando ${rep.label}...</p></section>`;

        try {
            const resp = await toProcess(rep.atx);
            if (!resp) return;

            const html = id === "solvencia"    ? vistaSolvencia(resp.data)
                       : id === "morosos"      ? vistaMorosos(resp.data)
                       : id === "estadisticas" ? vistaEstadisticas(resp.data)
                       : `<pre>${JSON.stringify(resp.data, null, 2)}</pre>`;

            this.#content.innerHTML = `<section class="view-section">${html}</section>`;
        } catch (err) {
            const esNoImpl = err instanceof ApiError && err.status === 501;
            this.#content.innerHTML = `<section class="view-section">
                <p class="view-not-implemented">
                    ${esNoImpl ? "Clase de negocio no implementada." : `⚠️ ${err.message}`}
                </p></section>`;
        }
    }

    #resolveHash() {
        const hash  = window.location.hash.replace("#", "");
        const match = REPORTES.find(r => r.id === hash);
        if (match) this.#activar(match.id);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
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
