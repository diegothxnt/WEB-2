/**
 * Clase que representa un ítem de menú.
 */
class MenuItem {
    constructor(id, label) {
        this.id = id;
        this.label = label;
    }

    // Crea el elemento DOM del botón
    render(onClickCallback) {
        const button = document.createElement('button');
        button.className = 'btn-menu';
        button.textContent = this.label;
        button.onclick = () => onClickCallback(this.id, this.label);
        return button;
    }
}

/**
 * Clase principal que gestiona la pantalla de Mantenimiento.
 */
class MantenimientoApp {
    constructor() {
        this.menuContainer = document.getElementById('sidebar-menu');
        this.contentContainer = document.getElementById('main-content');
        this.menuItems = [
            new MenuItem('prestamos', 'Préstamos'),
            new MenuItem('reportes', 'Reportes'),
            new MenuItem('devoluciones', 'Devoluciones'),
            new MenuItem('estado', 'Estado de Equipos y Componentes'),
            new MenuItem('notificaciones', 'Notificaciones'),
            new MenuItem('inventario', 'Inventario'),
            new MenuItem('ubicacion', 'Ubicación')
        ];
    }

    init() {
        this.renderMenu();
    }

    renderMenu() {
        this.menuItems.forEach(item => {
            const buttonElement = item.render((id, label) => this.cambiarPantalla(id, label));
            this.menuContainer.appendChild(buttonElement);
        });
    }

    cambiarPantalla(id, label) {
        // Lógica para actualizar el contenido principal
        this.contentContainer.innerHTML = `
            <section id="view-${id}">
                <h2>Pantalla: ${label}</h2>
                <hr>
                <p>Contenido para la gestión de ${label.toLowerCase()}...</p>
            </section>
        `;
    }
}

// Inicializar la aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    const app = new MantenimientoApp();
    app.init();
});