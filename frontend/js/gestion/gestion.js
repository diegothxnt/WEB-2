/**
 * @file js/gestion/gestion.js
 * Lógica del panel de gestión (gestion.html).
 * - Auth guard
 * - Sidebar con ítems; "Reportes" navega a reportes.html
 * - Hash en la URL para activar un ítem directamente
 */

const LOGIN_URL   = '/pages/auth/login.html';
const SESSION_URL = '/api/users/me';
const LOGOUT_URL  = '/api/auth/logout';

/* ─── Definición de módulos ──────────────────────────────────── */
const MODULOS = [
    {
        id:    'prestamos',
        label: 'Préstamos',
        icon:  '/assets/icons/icon-prestamos.svg',
        desc:  'Registrar un nuevo préstamo de equipo o componente.'
    },
    {
        id:    'devoluciones',
        label: 'Devoluciones',
        icon:  '/assets/icons/icon-devoluciones.svg',
        desc:  'Registrar la devolución de un equipo prestado.'
    },
    {
        id:    'estado',
        label: 'Estado de Equipos',
        icon:  '/assets/icons/icon-estado-equipos.svg',
        desc:  'Consultar y actualizar la condición de los equipos.'
    },
    {
        id:    'inventario',
        label: 'Inventario',
        icon:  '/assets/icons/icon-inventario.svg',
        desc:  'Gestionar el inventario de componentes y equipos.'
    },
    {
        id:    'notificaciones',
        label: 'Notificaciones',
        icon:  '/assets/icons/icon-notificaciones.svg',
        desc:  'Revisar alertas y avisos del sistema.'
    },
    {
        id:    'ubicacion',
        label: 'Ubicación',
        icon:  '/assets/icons/icon-ubicacion.svg',
        desc:  'Ver y editar la ubicación de los equipos en el laboratorio.'
    },
    {
        id:    'reportes',
        label: 'Reportes',
        icon:  '/assets/icons/icon-reportes.svg',
        href:  '../reportes/reportes.html'   // Navega a otra página
    }
];

/* ─── Clase MenuItem ─────────────────────────────────────────── */
class MenuItem {
    constructor({ id, label, icon, href = null }) {
        this.id    = id;
        this.label = label;
        this.icon  = icon;
        this.href  = href;
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

        if (this.href) {
            btn.addEventListener('click', () => { window.location.href = this.href; });
        } else {
            btn.addEventListener('click', () => onClick(this.id));
        }

        return btn;
    }
}

/* ─── Clase GestionApp ───────────────────────────────────────── */
class GestionApp {
    #sidebar;
    #content;
    #items;

    constructor() {
        this.#sidebar = document.getElementById('sidebar-menu');
        this.#content = document.getElementById('main-content');
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

    #activar(id) {
        /* Actualizar estado activo en el sidebar */
        this.#sidebar.querySelectorAll('.btn-menu').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.id === id);
        });

        history.replaceState(null, '', `#${id}`);
        this.#renderVista(id);
    }

    #renderVista(id) {
        const modulo = MODULOS.find(m => m.id === id);
        if (!modulo) return;

        this.#content.innerHTML = `
            <section class="view-section" aria-labelledby="view-title-${id}">
                <h2 id="view-title-${id}">${modulo.label}</h2>
                <hr class="view-divider">
                <p>${modulo.desc ?? ''}</p>
            </section>
        `;
    }

    #resolveHash() {
        const hash  = window.location.hash.replace('#', '');
        const match = MODULOS.find(m => m.id === hash && !m.href);
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

    new GestionApp().init();

});
