/**
 * @file js/shared/api.js
 * Helper de comunicación con el backend.
 *
 * toProcess() punto de entrada para operaciones de negocio.
 * El cliente nunca llama a rutas de clases de negocio directamente —
 * solo envía un atx + params y el backend resuelve el resto.
 *
 * Uso:
 *   import { toProcess } from '/js/shared/api.js';
 *
 *   const { data } = await toProcess(10);
 *   const { data } = await toProcess(11, [params]);
 */

const TO_PROCESS_URL = "/api/toProcess";
const LOGIN_URL      = "/pages/auth/login.html";

/**
 * Envía una transacción al endpoint /api/toProcess.
 *
 * @param {number} atx      - Id de transacción (definido en atxMap.json)
 * @param {Array}  params   - Parámetros requeridos por el método de negocio
 * @returns {Promise<{ success: boolean, data: any } | null>}
 *   Retorna null si la sesión expiró (ya habrá redirigido al login).
 * @throws {ApiError} cuando el servidor responde con un error de negocio
 */
export async function toProcess(atx, params = []) {
    const res = await fetch(TO_PROCESS_URL, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ atx, params })
    });

    // Sesión expirada — redirigir al login
    if (res.status === 401) {
        window.location.replace(LOGIN_URL);
        return null;
    }

    const body = await res.json().catch(() => ({
        success: false,
        message: "Respuesta inválida del servidor"
    }));

    if (!res.ok) {
        throw new ApiError(body.message ?? `Error ${res.status}`, res.status);
    }

    return body;
}

/**
 * Error tipado para respuestas fallidas del backend.
 * Permite distinguir entre errores de red y errores de negocio.
 */
export class ApiError extends Error {
    /**
     * @param {string} message
     * @param {number} status
     */
    constructor(message, status) {
        super(message);
        this.name   = "ApiError";
        this.status = status;
    }
}
