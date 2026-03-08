/**
 * Clase para representar cada opción de reporte
 */
class OpcionReporte {
    constructor(id, titulo) {
        this.id = id;
        this.titulo = titulo;
    }

    // Crea el botón con el estilo visual del sistema
    render(alHacerClick) {
        const boton = document.createElement('button');
        boton.className = 'btn-menu';
        boton.textContent = this.titulo;
        boton.onclick = () => alHacerClick(this.id, this.titulo);
        return boton;
    }
}

/**
 * Clase principal que gestiona la pantalla de Reportes
 */
class ReportesApp {
    constructor() {
        this.menuContainer = document.getElementById('sidebar-reportes');
        this.mainContent = document.getElementById('main-content');
        
        // Definición de las opciones según la nueva imagen
        this.opciones = [
            new OpcionReporte('solvencia', 'SOLVENCIA'),
            new OpcionReporte('morosos', 'LISTADO DE MOROSOS'),
            new OpcionReporte('estadisticas', 'ESTADISTICAS')
        ];
    }

    init() {
        this.renderMenu();
    }

    renderMenu() {
        this.opciones.forEach(opcion => {
            const botonElemento = opcion.render((id, titulo) => this.cargarVistaReporte(id, titulo));
            this.menuContainer.appendChild(botonElemento);
        });
    }

    cargarVistaReporte(id, titulo) {
        // Aquí se inyectará el contenido de cada reporte
        this.mainContent.innerHTML = `
            <section class="reporte-detalle">
                <h2>${titulo}</h2>
                <hr style="margin-bottom: 20px;">
                <p>Generando vista para el módulo de <strong>${id}</strong>...</p>
                </section>
        `;
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    const app = new ReportesApp();
    app.init();
});