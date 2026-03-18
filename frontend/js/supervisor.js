/**
 * js/supervisor.js - Panel Operativo del Laboratorio
 * Incluye gestión de préstamos, inventario, morosos y alertas.
 */

// 1. FUNCIÓN PARA NAVEGACIÓN (RENDERIZADO)
function render(view) {
    const content = document.getElementById('dynamic-content');
    const title = document.getElementById('view-title');

    switch(view) {
        // --- OPCIÓN: PRÉSTAMOS / DEVOLUCIÓN ---
        case 'prestamos':
            title.innerText = "Registrar Préstamo o Devolución";
            content.innerHTML = `
                <div class="card-form">
                    <h3>📦 Nuevo Movimiento de Equipo</h3>
                    <div class="grid-2">
                        <div class="field"><label>Cédula Estudiante:</label><input type="text" class="modern-input" placeholder="V-00.000.000"></div>
                        <div class="field"><label>Código del Equipo:</label><input type="text" class="modern-input" placeholder="Ej: OSC-01"></div>
                        <div class="field"><label>Fecha de Retorno:</label><input type="date" class="modern-input"></div>
                        <div class="field"><label>Tipo de Operación:</label>
                            <select class="modern-input"><option>Préstamo</option><option>Devolución</option></select>
                        </div>
                    </div>
                    <button class="btn-primary mt-20" onclick="alert('Movimiento Procesado')">Procesar Registro</button>
                </div>`;
            break;

        // --- OPCIÓN: CONTROL INVENTARIO (TABLA CON LÍNEAS) ---
        case 'inventario':
            title.innerText = "Control de Inventario Real";
            content.innerHTML = `
                <div class="card-form">
                    <h3>🛠️ Equipos Registrados en Sistema</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Descripción del Equipo</th>
                                <th>Ubicación</th>
                                <th>Estado Actual</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>OSC-01</td><td>Osciloscopio Digital Tektronix</td><td>Estante A-1</td><td><span class="badge active">Disponible</span></td></tr>
                            <tr><td>MUL-05</td><td>Multímetro Fluke 115</td><td>Mesa 3</td><td><span class="badge blocked">Prestado</span></td></tr>
                            <tr><td>CAU-12</td><td>Cautín Weller 40W</td><td>Caja Herramientas</td><td><span class="badge active">Disponible</span></td></tr>
                        </tbody>
                    </table>
                </div>`;
            break;

        // --- OPCIÓN: ESTUDIANTES MOROSOS ---
        case 'morosos':
            title.innerText = "Control de Estudiantes Morosos";
            content.innerHTML = `
                <div class="card-form">
                    <h3>⚠️ Lista de Retrasos Pendientes</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Estudiante</th>
                                <th>Cédula</th>
                                <th>Equipo Adeudado</th>
                                <th>Días Retraso</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>Ana López</td><td>V-25.333.444</td><td>Cautín Pro #4</td><td><b style="color:red">3 Días</b></td></tr>
                            <tr><td>Pedro Pérez</td><td>V-20.111.222</td><td>Multímetro Fluke</td><td><b style="color:red">1 Día</b></td></tr>
                        </tbody>
                    </table>
                </div>`;
            break;

        // --- OPCIÓN: SOLVENCIAS ---
        case 'solvencias':
            title.innerText = "Emisión de Solvencias Académicas";
            content.innerHTML = `
                <div class="card-form" style="max-width: 500px; margin: 0 auto;">
                    <h3>📄 Generar Solvencia de Laboratorio</h3>
                    <div class="field">
                        <label>Ingrese Cédula para Verificar:</label>
                        <input type="text" class="modern-input" placeholder="V-00.000.000">
                    </div>
                    <div class="field mt-20" id="resultado-solvencia" style="padding:15px; background:#f0f9ff; border-radius:8px; border:1px solid #bae6fd; display:none;">
                        <p style="font-size:13px; color:#0369a1;"><b>Resultado:</b> Estudiante sin deudas pendientes.</p>
                    </div>
                    <button class="btn-primary mt-20" onclick="document.getElementById('resultado-solvencia').style.display='block'">Verificar y Generar PDF</button>
                </div>`;
            break;

        // --- OPCIÓN: ENVIAR ALERTAS (TU PEDIDO ESPECIAL) ---
        case 'notificaciones':
            title.innerText = "Enviar Alertas al Alumnado";
            content.innerHTML = `
                <div class="card-form">
                    <h3>📢 Redactar Alerta de Laboratorio</h3>
                    <div class="grid-2">
                        <div class="field">
                            <label>Destinatarios:</label>
                            <select class="modern-input">
                                <option>Todos los Estudiantes</option>
                                <option>Solo con Equipos Prestados</option>
                                <option>Solo Estudiantes Morosos</option>
                            </select>
                        </div>
                        <div class="field">
                            <label>Prioridad del Mensaje:</label>
                            <select class="modern-input">
                                <option>Informativa</option>
                                <option>Urgente (Cierre/Multa)</option>
                            </select>
                        </div>
                    </div>
                    <div class="field mt-20">
                        <label>Cuerpo del Mensaje:</label>
                        <textarea class="modern-input" rows="3" style="resize:none;" placeholder="Escriba el aviso aquí..."></textarea>
                    </div>
                    <button class="btn-primary mt-20" onclick="alert('Notificación enviada a los servidores de correo')">Difundir Mensaje</button>
                </div>

                <div class="card-form mt-20">
                    <h3>📋 Historial de Notificaciones</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Grupo Destino</th>
                                <th>Asunto / Resumen</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>18/03/2026</td><td>Morosos</td><td>Aviso de mora: Multa por retraso...</td><td>Enviado</td></tr>
                            <tr><td>15/03/2026</td><td>General</td><td>Horario especial semana santa...</td><td>Enviado</td></tr>
                        </tbody>
                    </table>
                </div>`;
            break;

        default:
            content.innerHTML = `<div class="welcome-box"><h3>Seleccione una operación en el menú</h3></div>`;
    }
}

// 2. CIERRE DE SESIÓN
document.getElementById('logoutBtn').addEventListener('click', () => {
    window.location.href = "login.html";
});