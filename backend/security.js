/**
 * @file security.js
 * Componente de seguridad del sistema.
 *
 * Singleton — se instancia una vez al arrancar el servidor.
 * El constructor carga los tres mapas de seguridad desde config/.
 *
 * Mapas internos:
 *   atxMap        — id  → { subsystem, className, methodName }
 *   permissionMap — "subsystem-className-methodName-profile" → true
 *   optionMap     — "subsystem-option-profile"               → true
 */

import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export class SecurityComponent {

    /** @type {Map<number, { subsystem: string, className: string, methodName: string }>} */
    #atxMap        = new Map();

    /** @type {Map<string, true>} */
    #permissionMap = new Map();

    /** @type {Map<string, true>} */
    #optionMap     = new Map();

    constructor() {
        this.#loadMaps();
    }

    // ─────────────────────────────────────────────────────────────
    // Carga de mapas desde archivos de configuración
    // ─────────────────────────────────────────────────────────────

    #loadMaps() {
        const read = (file) =>
            JSON.parse(fs.readFileSync(path.join(__dirname, "config", file), "utf-8"));

        // Mapa de transacciones
        const { transactions } = read("atxMap.json");
        for (const tx of transactions) {
            this.#atxMap.set(tx.id, {
                subsystem:  tx.subsystem,
                className:  tx.className,
                methodName: tx.methodName
            });
        }

        // Mapa de permisos a métodos  →  subsystem-className-methodName-profile
        const { permissions } = read("permissionMap.json");
        for (const p of permissions) {
            const key = `${p.subsystem}-${p.className}-${p.methodName}-${p.profile}`;
            this.#permissionMap.set(key, true);
        }

        // Mapa de permisos a opciones  →  subsystem-option-profile
        const { options } = read("optionMap.json");
        for (const o of options) {
            const key = `${o.subsystem}-${o.option}-${o.profile}`;
            this.#optionMap.set(key, true);
        }

        console.log(
            `[Security] Mapas cargados — ` +
            `atx: ${this.#atxMap.size} | ` +
            `permisos: ${this.#permissionMap.size} | ` +
            `opciones: ${this.#optionMap.size}`
        );
    }

    // ─────────────────────────────────────────────────────────────
    // Consultas públicas
    // ─────────────────────────────────────────────────────────────

    /**
     * Indica si el id de transacción existe en el mapa.
     * @param {number} atx
     */
    atxExists(atx) {
        return this.#atxMap.has(atx);
    }

    /**
     * Retorna los datos de la transacción o null si no existe.
     * @param {number} atx
     * @returns {{ subsystem: string, className: string, methodName: string } | null}
     */
    getTransaction(atx) {
        return this.#atxMap.get(atx) ?? null;
    }

    /**
     * Verifica si el perfil tiene permiso para ejecutar una transacción.
     *
     * Construye la clave: subsystem-className-methodName-profile
     *
     * @param {string} profile
     * @param {number} atx
     * @returns {boolean}
     */
    hasPermission(profile, atx) {
        const tx = this.#atxMap.get(atx);
        if (!tx) return false;
        const key = `${tx.subsystem}-${tx.className}-${tx.methodName}-${profile}`;
        return this.#permissionMap.has(key);
    }

    /**
     * Verifica si el perfil tiene permiso para acceder a una opción de menú.
     *
     * Construye la clave: subsystem-option-profile
     *
     * @param {string} profile
     * @param {string} subsystem
     * @param {string} option
     * @returns {boolean}
     */
    hasOptionPermission(profile, subsystem, option) {
        const key = `${subsystem}-${option}-${profile}`;
        return this.#optionMap.has(key);
    }

    /**
     * Ejecuta un método de una clase de negocio por reflexión.
     *
     * Flujo:
     *   1. Importa dinámicamente ./business/{subsystem}/{className}.js
     *   2. Instancia la clase exportada por defecto
     *   3. Llama al método por nombre (bracket notation)
     *   4. Responde con el resultado o con el error apropiado
     *
     * @param {{ subsystem: string, className: string, methodName: string }} txData
     * @param {Array}                            params
     * @param {import("express").Request}        req
     * @param {import("express").Response}       res
     */
    async exeMethod(txData, params, req, res) {
        const modulePath = path.join(
            __dirname,
            "business",
            txData.subsystem,
            `${txData.className}.js`
        );

        const moduleURL = new URL(`file://${modulePath}`).href;

        let BusinessClass;
        try {
            const module = await import(moduleURL);
            // Acepta export default o export nombrado igual al className
            BusinessClass = module.default ?? module[txData.className];
        } catch (err) {
            if (err.code === "ERR_MODULE_NOT_FOUND" || err.code === "ERR_LOAD_URL") {
                return res.status(501).json({
                    success: false,
                    message: `Clase de negocio "${txData.className}" aún no implementada`
                });
            }
            throw err;
        }

        if (typeof BusinessClass !== "function") {
            return res.status(501).json({
                success: false,
                message: `El módulo "${txData.className}" no exporta una clase válida`
            });
        }

        const instance = new BusinessClass();

        if (typeof instance[txData.methodName] !== "function") {
            return res.status(501).json({
                success: false,
                message: `Método "${txData.methodName}" no implementado en "${txData.className}"`
            });
        }

        const result = await instance[txData.methodName](params, req);
        return res.json({ success: true, data: result });
    }
}

// Singleton
const security = new SecurityComponent();
export default security;
