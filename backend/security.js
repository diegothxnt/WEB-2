/**
 * @file security.js
 * Componente de seguridad del sistema.
 *
 * Singleton — se instancia una vez al arrancar el servidor.
 * Los mapas de seguridad se cargan desde la base de datos.
 *
 * Mapas internos:
 *   atxMap        — id  → { subsystem, className, methodName }
 *   permissionMap — "subsystem-className-methodName-profile" → true
 *   optionMap     — "subsystem-option-profile"               → true
 */

import path from "path";
import { fileURLToPath } from "url";
import db from "./db/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQL_ATX = `
    SELECT
        t.id_transaccion AS id,
        s.nombre         AS subsystem,
        c.nombre         AS class_name,
        m.nombre         AS method_name
    FROM transaccion t
    JOIN subsistema s ON s.id_subsistema = t.id_subsistema
    JOIN clase c      ON c.id_clase = t.id_clase
    JOIN metodo m     ON m.id_metodo = t.id_metodo
    ORDER BY t.id_transaccion
`;

const SQL_PERMISSIONS = `
    SELECT
        t.id_transaccion AS id,
        s.nombre         AS subsystem,
        c.nombre         AS class_name,
        m.nombre         AS method_name,
        p.nombre         AS profile
    FROM transaccion_perfil tp
    JOIN transaccion t ON t.id_transaccion = tp.id_transaccion
    JOIN subsistema s  ON s.id_subsistema = t.id_subsistema
    JOIN clase c       ON c.id_clase = t.id_clase
    JOIN metodo m      ON m.id_metodo = t.id_metodo
    JOIN perfil p      ON p.id_perfil = tp.id_perfil
    ORDER BY t.id_transaccion, p.nombre
`;

const SQL_OPTIONS = `
    SELECT
        o.id_opcion AS id,
        s.nombre    AS subsystem,
        o.codigo    AS option_code,
        p.nombre    AS profile
    FROM opcion_perfil op
    JOIN opcion o    ON o.id_opcion = op.id_opcion
    JOIN subsistema s ON s.id_subsistema = o.id_subsistema
    JOIN perfil p    ON p.id_perfil = op.id_perfil
    ORDER BY s.nombre, o.codigo, p.nombre
`;

export class SecurityComponent {

    /** @type {Map<number, { subsystem: string, className: string, methodName: string }>} */
    #atxMap = new Map();

    /** @type {Map<string, true>} */
    #permissionMap = new Map();

    /** @type {Map<string, true>} */
    #optionMap = new Map();

    constructor() {
        this.ready = this.#loadMaps().catch(err => {
            console.error("[Security] No se pudieron cargar los mapas de seguridad:", err);
            return false;
        });
    }

    ready = Promise.resolve();

    async #loadMaps() {
        this.#atxMap.clear();
        this.#permissionMap.clear();
        this.#optionMap.clear();

        try {
            const [atxRes, permRes, optRes] = await Promise.all([
                db.query(SQL_ATX),
                db.query(SQL_PERMISSIONS),
                db.query(SQL_OPTIONS)
            ]);

            for (const row of atxRes.rows) {
                this.#atxMap.set(Number(row.id), {
                    subsystem: row.subsystem,
                    className: row.class_name,
                    methodName: row.method_name
                });
            }

            for (const row of permRes.rows) {
                const key = `${row.subsystem}-${row.class_name}-${row.method_name}-${row.profile}`;
                this.#permissionMap.set(key, true);
            }

            for (const row of optRes.rows) {
                const key = `${row.subsystem}-${row.option_code}-${row.profile}`;
                this.#optionMap.set(key, true);
            }

            console.log(
                `[Security] Mapas cargados desde BD — ` +
                `atx: ${this.#atxMap.size} | ` +
                `permisos: ${this.#permissionMap.size} | ` +
                `opciones: ${this.#optionMap.size}`
            );
        } catch (err) {
            console.error("[Security] Error cargando mapas desde BD:", err);
            throw err;
        }
    }

    // ─── Consultas públicas ───────────────────────────────────────

    /**
     * Indica si el id de transacción existe en el mapa.
     * @param {number} atx
     */
    atxExists(atx) {
        return this.#atxMap.has(Number(atx));
    }

    /**
     * Retorna los datos de la transacción o null si no existe.
     * @param {number} atx
     * @returns {{ subsystem: string, className: string, methodName: string } | null}
     */
    getTransaction(atx) {
        return this.#atxMap.get(Number(atx)) ?? null;
    }

    /**
     * Verifica si el usuario tiene permiso para ejecutar un ATX.
     *
     * Precedencia:
     *   1. usuario_permiso_override (manual por head_admin)
     *   2. permissionMap (basado en perfil, cargado desde la BD)
     *
     * @param {string} profile
     * @param {number} atx
     * @param {number} userId
     * @returns {Promise<boolean>}
     */
    async hasPermission(profile, atx, userId) {
        await this.ready;
        const atxId = Number(atx);

        try {
            const result = await db.query(
                `SELECT puede_ejecutar
                 FROM usuario_permiso_override
                 WHERE id_usuario = $1 AND atx = $2
                 LIMIT 1`,
                [userId, atxId]
            );

            if (result.rows.length > 0) {
                return result.rows[0].puede_ejecutar;
            }
        } catch (err) {
            console.warn("[Security] No se pudo consultar override:", err.message);
        }

        const tx = this.#atxMap.get(atxId);
        if (!tx) return false;

        const key = `${tx.subsystem}-${tx.className}-${tx.methodName}-${profile}`;
        return this.#permissionMap.has(key);
    }

    /**
     * Verifica si el perfil tiene permiso para acceder a una opción de menú.
     *
     * @param {string} profile
     * @param {string} subsystem
     * @param {string} option
     * @returns {boolean}
     */
    async hasOptionPermission(profile, subsystem, option) {
        await this.ready;
        const key = `${subsystem}-${option}-${profile}`;
        return this.#optionMap.has(key);
    }

    // ─── Ejecución por reflexión ──────────────────────────────────

    /**
     * Importa dinámicamente ./BO/{subsystem}/{className}.js,
     * instancia la clase y llama al método correspondiente.
     *
     * @param {{ subsystem, className, methodName }} txData
     * @param {Array}   params
     * @param {Request} req
     * @param {Response} res
     */
    async exeMethod(txData, params, req, res) {
        await this.ready;
        const modulePath = path.join(
            __dirname,
            "BO",
            txData.subsystem,
            `${txData.className}.js`
        );

        const moduleURL = new URL(`file://${modulePath}`).href;

        let BusinessClass;
        try {
            const mod = await import(moduleURL);
            BusinessClass = mod.default ?? mod[txData.className];
        } catch (err) {
            if (err.code === "ERR_MODULE_NOT_FOUND" || err.code === "ERR_LOAD_URL") {
                return res.status(501).json({
                    success: false,
                    message: `Business Object "${txData.className}" aún no implementado`
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
