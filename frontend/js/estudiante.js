function render(view) {
    const content = document.getElementById('dynamic-content');
    const title = document.getElementById('view-title');

    switch(view) {
        case 'mis_prestamos':
            title.innerText = "Historial de Préstamos";
            content.innerHTML = `
                <div class="card-form">
                    <h3>Mis Equipos Poseídos</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th style="width: 15%;">Código</th>
                                <th style="width: 40%;">Equipo</th>
                                <th style="width: 20%;">Prestado</th>
                                <th style="width: 20%;">Entrega</th>
                                <th style="width: 5%;">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>#GEN-01</strong></td>
                                <td>Generador de Señales Rigol</td>
                                <td>15/03/2026</td>
                                <td>22/03/2026</td>
                                <td><span class="badge warning">En Uso</span></td>
                            </tr>
                            <tr>
                                <td><strong>#PRO-10</strong></td>
                                <td>Protoboard Grande</td>
                                <td>10/03/2026</td>
                                <td>17/03/2026</td>
                                <td><span class="badge active">Solvente</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>`;
            break;

        case 'catalogo':
            title.innerText = "Inventario del Laboratorio";
            content.innerHTML = `
                <div class="card-form">
                    <h3>Consulta de Disponibilidad</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Ref.</th>
                                <th>Nombre del Equipo</th>
                                <th>Ubicación</th>
                                <th>Disponibles</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>001</td>
                                <td>Multímetro Fluke 115</td>
                                <td>Estante A-1</td>
                                <td>8 unidades</td>
                                <td><button class="btn-table">Solicitar</button></td>
                            </tr>
                            <tr>
                                <td>002</td>
                                <td>Cautín Weller 40W</td>
                                <td>Estante C-2</td>
                                <td>12 unidades</td>
                                <td><button class="btn-table">Solicitar</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>`;
            break;
    }
}