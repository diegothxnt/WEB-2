/**
 * @file js/shared/auth.js
 * Guards de autenticación y autorización compartidos por todas las páginas.
 *
 * Uso en una página protegida:
 *   import { guardPage } from '/js/shared/auth.js';
 *   const user = await guardPage(['admin', 'head_admin']);
 *   // user.profile, user.usuario, etc.
 */

const SESSION_URL  = "/api/users/me";
const LOGIN_URL    = "/pages/auth/login.html";
const DASHBOARD_URL = "/pages/dashboard.html";

// Cache de sesión para el ciclo de vida de la página
let _cachedUser = null;

/**
 * Obtiene el usuario de sesión actual.
 * Retorna null si no hay sesión activa (y redirige al login).
 *
 * @returns {Promise<{ id: number, usuario: string, profile: string } | null>}
 */
export async function getSessionUser() {
    if (_cachedUser) return _cachedUser;

    const res = await fetch(SESSION_URL, { credentials: "include" }).catch(() => null);

    if (!res || !res.ok) {
        window.location.replace(LOGIN_URL);
        return null;
    }

    const data   = await res.json();
    _cachedUser  = data.user;
    return _cachedUser;
}

/**
 * Protege una página verificando:
 *   1. Que haya sesión activa (redirige a login si no)
 *   2. Que el perfil del usuario esté en allowedProfiles
 *      (redirige a dashboard con error=forbidden si no)
 *
 * @param {string[]} allowedProfiles  - Perfiles permitidos para esta página
 * @returns {Promise<object | null>}  - El usuario si tiene acceso, null si fue redirigido
 */
export async function guardPage(allowedProfiles) {
    const user = await getSessionUser();
    if (!user) return null; // getSessionUser ya redirigió al login

    if (!allowedProfiles.includes(user.profile)) {
        window.location.replace(`${DASHBOARD_URL}?error=forbidden`);
        return null;
    }

    return user;
}

/**
 * Definición de módulos del dashboard por perfil.
 * Centralizado aquí para mantener consistencia entre dashboard.js y otras vistas.
 */
export const DASHBOARD_MODULES = {

    head_admin: [
        { id: "prestamos",       label: "Préstamos",          icon: "/assets/icons/icon-prestamos.svg",      href: "gestion/gestion.html#prestamos",           desc: "Ver, crear y gestionar todos los préstamos del laboratorio."      },
        { id: "devoluciones",    label: "Devoluciones",        icon: "/assets/icons/icon-devoluciones.svg",   href: "gestion/gestion.html#devoluciones",         desc: "Registrar y consultar todas las devoluciones de equipos."         },
        { id: "inventario",      label: "Inventario",           icon: "/assets/icons/icon-inventario.svg",     href: "gestion/gestion.html#inventario",           desc: "Gestionar stock, estado y ubicación de equipos y componentes."    },
        { id: "estado",          label: "Estado de Equipos",   icon: "/assets/icons/icon-estado-equipos.svg", href: "gestion/gestion.html#estado",               desc: "Consultar y actualizar el estado operativo de cada equipo."       },
        { id: "amonestaciones",  label: "Amonestaciones",       icon: "/assets/icons/icon-alerta.svg",         href: "gestion/gestion.html#amonestaciones",       desc: "Asignar multas y verificar comprobantes de pago."                 },
        { id: "notificaciones",  label: "Notificaciones",       icon: "/assets/icons/icon-notificaciones.svg", href: "gestion/gestion.html#notificaciones",       desc: "Revisar y enviar notificaciones a los usuarios del sistema."      },
        { id: "reportes",        label: "Reportes",             icon: "/assets/icons/icon-reportes.svg",       href: "reportes/reportes.html",                    desc: "Generar informes de solvencia, morosos y estadísticas generales." },
        { id: "gestion-usuarios",label: "Gestión de Usuarios",  icon: "/assets/icons/icon-usuario.svg",        href: "admin-usuarios/admin-usuarios.html",         desc: "Asignar perfiles, permisos manuales y crear administradores."     }
    ],

    admin: [
        { id: "prestamos",      label: "Préstamos",          icon: "/assets/icons/icon-prestamos.svg",      href: "gestion/gestion.html#prestamos",       desc: "Ver, crear y gestionar todos los préstamos del laboratorio."      },
        { id: "devoluciones",   label: "Devoluciones",        icon: "/assets/icons/icon-devoluciones.svg",   href: "gestion/gestion.html#devoluciones",    desc: "Registrar y consultar todas las devoluciones de equipos."         },
        { id: "inventario",     label: "Inventario",           icon: "/assets/icons/icon-inventario.svg",     href: "gestion/gestion.html#inventario",      desc: "Gestionar stock, estado y ubicación de equipos y componentes."    },
        { id: "estado",         label: "Estado de Equipos",   icon: "/assets/icons/icon-estado-equipos.svg", href: "gestion/gestion.html#estado",          desc: "Consultar y actualizar el estado operativo de cada equipo."       },
        { id: "amonestaciones", label: "Amonestaciones",       icon: "/assets/icons/icon-alerta.svg",         href: "gestion/gestion.html#amonestaciones",  desc: "Asignar multas y verificar comprobantes de pago."                 },
        { id: "notificaciones", label: "Notificaciones",       icon: "/assets/icons/icon-notificaciones.svg", href: "gestion/gestion.html#notificaciones",  desc: "Revisar y enviar notificaciones a los usuarios del sistema."      },
        { id: "reportes",       label: "Reportes",             icon: "/assets/icons/icon-reportes.svg",       href: "reportes/reportes.html",               desc: "Generar informes de solvencia, morosos y estadísticas generales." }
    ],

    estudiante: [
        { id: "solicitar",       label: "Solicitar Préstamo",  icon: "/assets/icons/icon-prestamos.svg",      href: "gestion/gestion.html#solicitar",       desc: "Consultar equipos y componentes disponibles y hacer tu solicitud." },
        { id: "mis-prestamos",   label: "Mis Préstamos",        icon: "/assets/icons/icon-inventario.svg",     href: "gestion/gestion.html#mis-prestamos",   desc: "Ver el estado de tus préstamos activos y su fecha de entrega."     },
        { id: "mis-devoluciones",label: "Mis Devoluciones",     icon: "/assets/icons/icon-devoluciones.svg",   href: "gestion/gestion.html#mis-devoluciones",desc: "Confirmar que todos tus equipos han sido devueltos correctamente."  },
        { id: "mi-solvencia",    label: "Mi Solvencia",         icon: "/assets/icons/icon-solvencia.svg",      href: "gestion/gestion.html#mi-solvencia",    desc: "Ver tus amonestaciones pendientes y subir comprobantes de pago."   },
        { id: "notificaciones",  label: "Notificaciones",        icon: "/assets/icons/icon-notificaciones.svg", href: "gestion/gestion.html#notificaciones",  desc: "Alertas de vencimiento y avisos del laboratorio."                  }
    ]
};
