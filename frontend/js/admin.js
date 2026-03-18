/**
 * js/admin.js - Versión Final con Mantenimientos Completos
 */

function toggleMenu(id) {
    document.querySelectorAll('.submenu').forEach(s => {
        if (s.id !== id) s.style.display = 'none';
    });
    const el = document.getElementById(id);
    if (el) {
        const isVisible = el.style.display === 'block';
        el.style.display = isVisible ? 'none' : 'block';
    }
}

function render(view) {
    const content = document.getElementById('dynamic-content');
    const title = document.getElementById('view-title');

    // Función auxiliar para crear formularios rápidos
    const crearForm = (subtitulo, campos) => `
        <div class="card-form">
            <h3>${subtitulo}</h3>
            <div class="grid-2">
                ${campos.map(c => `
                    <div class="field">
                        <label>${c.label}</label>
                        ${c.type === 'select' 
                            ? `<select class="modern-input">${c.options.map(o => `<option>${o}</option>`).join('')}</select>`
                            : `<input type="${c.type}" class="modern-input" placeholder="${c.placeholder || ''}">`
                        }
                    </div>
                `).join('')}
            </div>
            <button class="btn-primary" onclick="alert('Registro guardado localmente')">Guardar Cambios</button>
        </div>
    `;

    switch(view) {
        // --- GRUPO: IDENTIDAD ---
        case 'mant_usuario':
            title.innerText = "Mantenimiento de Usuarios";
            content.innerHTML = crearForm("👤 Nuevo Usuario", [
                { label: "Nombre de Usuario (Login)", type: "text" },
                { label: "Contraseña", type: "password" },
                { label: "Asignar Persona", type: "select", options: ["Diego Pérez", "Paul Rivas"] },
                { label: "Estado", type: "select", options: ["Activo", "Bloqueado"] }
            ]);
            break;

        case 'mant_persona':
            title.innerText = "Mantenimiento de Personas";
            content.innerHTML = crearForm("👥 Datos Personales", [
                { label: "Cédula", type: "text" },
                { label: "Nombre y Apellido", type: "text" },
                { label: "Correo URU", type: "email" },
                { label: "Grupo", type: "select", options: ["Estudiante", "Docente", "Administrativo"] }
            ]);
            break;

        case 'mant_grupo':
            title.innerText = "Mantenimiento de Grupos";
            content.innerHTML = crearForm("📁 Categorías de Usuario", [
                { label: "Nombre del Grupo", type: "text", placeholder: "Ej: Preparadores" },
                { label: "Descripción", type: "text" }
            ]);
            break;

        // --- GRUPO: INFRAESTRUCTURA ---
        case 'mant_subsistema':
            title.innerText = "Mantenimiento de Subsistemas";
            content.innerHTML = crearForm("🏗️ Módulo del Sistema", [
                { label: "Nombre del Subsistema", type: "text", placeholder: "Ej: Seguridad" },
                { label: "Abreviatura", type: "text", placeholder: "SEG" }
            ]);
            break;

        case 'mant_objetos':
            title.innerText = "Mantenimiento de Objetos (Clases)";
            content.innerHTML = crearForm("📦 Registro de Clases", [
                { label: "Nombre de Clase", type: "text" },
                { label: "Subsistema Padre", type: "select", options: ["Seguridad", "Inventario", "Préstamos"] }
            ]);
            break;

        case 'mant_metodos':
            title.innerText = "Mantenimiento de Métodos";
            content.innerHTML = crearForm("🛠️ Registro de Funciones", [
                { label: "Nombre del Método", type: "text" },
                { label: "Clase Perteneciente", type: "select", options: ["UserController", "EquipoController"] }
            ]);
            break;

        // --- GRUPO: CONTROL DE ACCESO ---
        case 'mant_perfil':
            title.innerText = "Mantenimiento de Perfiles";
            content.innerHTML = crearForm("🛡️ Definir Perfil de Seguridad", [
                { label: "Nombre del Perfil", type: "text", placeholder: "Ej: Auditor" },
                { label: "Nivel de Acceso", type: "select", options: ["Bajo", "Medio", "Alto", "Total"] }
            ]);
            break;

        case 'asig_permisos':
            title.innerText = "Asignación de Permisos";
            content.innerHTML = `
                <div class="card-form">
                    <h3>🔐 Vincular Métodos a Perfil</h3>
                    <div class="field"><label>Perfil:</label>
                        <select class="modern-input"><option>Supervisor</option><option>Estudiante</option></select>
                    </div>
                    <div class="check-grid-elegant mt-20">
                        <label><input type="checkbox"> Listar</label>
                        <label><input type="checkbox"> Insertar</label>
                        <label><input type="checkbox"> Eliminar</label>
                        <label><input type="checkbox"> Reportar</label>
                    </div>
                    <button class="btn-primary mt-20">Actualizar Permisos</button>
                </div>`;
            break;

        case 'asig_perfil_usu':
            title.innerText = "Asignar Perfil a Usuario";
            content.innerHTML = crearForm("🔗 Relación Usuario-Rol", [
                { label: "Seleccionar Usuario", type: "select", options: ["admin_uru", "p_rivas"] },
                { label: "Perfil a Otorgar", type: "select", options: ["Administrador", "Supervisor"] }
            ]);
            break;

        case 'opciones_menu':
            title.innerText = "Configuración de Menú";
            content.innerHTML = crearForm("📂 Ítems de Navegación", [
                { label: "Texto del Menú", type: "text" },
                { label: "Icono (Emoji)", type: "text" },
                { label: "Perfil que lo ve", type: "select", options: ["Todos", "Admin", "Supervisor"] }
            ]);
            break;

        default:
            content.innerHTML = `<h3>Opción no configurada</h3>`;
    }
}