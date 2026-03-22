/**
 * @file js/reportes/reportes.js
 * Lógica del panel de reportes (reportes.html).
 * - Auth guard
 * - Sidebar con opciones de reporte
 * - Hash en la URL para activar una opción directamente
 */

const LOGIN_URL   = '/pages/auth/login.html';
const SESSION_URL = '/api/users/me';
const LOGOUT_URL  = '/api/auth/logout';

/* ─── Definición de reportes ─────────────────────────────────── */
const REPORTES = [
    {
        id:    'solvencia',
        label: 'Solvencia',
        icon:  '/assets/icons/icon-solvencia.svg',
        desc:  'Consultar el estado de solvencia de los estudiantes con préstamos activos.'
    },
    {
        id:    'morosos',
        label: 'Listado de Morosos',
        icon:  '/assets/icons/icon-morosos.svg',
        desc:  'Ver el listado de usuarios con préstamos vencidos o pendientes de devolución.'
    },
    {
        id:    'estadisticas',
        label: 'Estadísticas',
        icon:  '/assets/icons/icon-estadisticas.svg',
        desc:  'Visualizar estadísticas generales de uso del laboratorio y sus equipos.'
    }
];

/* ─── Clase OpcionReporte ────────────────────────────────────── */
class OpcionReporte {
    constructor({ id, label, icon }) {
        this.id    = id;
        this.label = label;
        this.icon  = icon;
    }

    render(onClick) {
        const btn = document.createElement('button');
        btn.className  = 'btn-menu';
        btn.dataset.id = this.id;
        btn.type       = 'button';
        btn.setAttribute('aria-label', this.label);

        btn.innerHTML = `
            <img src="${this.icon}" alt="" class="btn-menu__icon" aria-hidden="true">
            ${this.label}
        `;

        btn.addEventListener('click', () => onClick(this.id));
        return btn;
    }
}

/* ─── Clase ReportesApp ──────────────────────────────────────── */
class ReportesApp {
    #sidebar;
    #content;
    #opciones;

    constructor() {
        this.#sidebar  = document.getElementById('sidebar-reportes');
        this.#content  = document.getElementById('main-content');
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

    #activar(id) {
        this.#sidebar.querySelectorAll('.btn-menu').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.id === id);
        });

        history.replaceState(null, '', `#${id}`);
        this.#renderVista(id);
    }

    #renderVista(id) {
        const reporte = REPORTES.find(r => r.id === id);
        if (!reporte) return;

        this.#content.innerHTML = `
            <section class="view-section" aria-labelledby="view-title-${id}">
                <h2 id="view-title-${id}">${reporte.label}</h2>
                <hr class="view-divider">
                <p>${reporte.desc}</p>
            </section>
        `;
    }

    #resolveHash() {
        const hash  = window.location.hash.replace('#', '');
        const match = REPORTES.find(r => r.id === hash);
        if (match) this.#activar(match.id);
    }
}

/* ─── Auth guard e inicialización ────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {

    const res = await fetch(SESSION_URL, { credentials: 'include' });
    if (!res.ok) { window.location.replace(LOGIN_URL); return; }

    const data = await res.json();

    const usernameEl = document.getElementById('usernameText');
    if (usernameEl) usernameEl.textContent = data.user?.usuario ?? 'Usuario';

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await fetch(LOGOUT_URL, { method: 'POST', credentials: 'include' });
        window.location.replace(LOGIN_URL);
    });

    new ReportesApp().init();

});
