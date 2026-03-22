import session from "express-session";
import connectPg from "connect-pg-simple";
import dotenv from "dotenv";
import fs from "fs";
import db from "./db/db.js";
import resolveValue from "./utils/resolveValue.js";
dotenv.config();

// ========================================================================
// UserSession — objeto de sesión asociado a un usuario activo
// Se crea al iniciar sesión y se almacena serializado en req.session.user
// ========================================================================

export class UserSession {
    /**
     * @param {Object} data
     * @param {number} data.id       - ID del usuario en la BD
     * @param {string} data.usuario  - Nombre de usuario
     * @param {string} [data.createdAt] - ISO timestamp de creación
     */
    constructor({ id, usuario, createdAt = null }) {
        this.id = id;
        this.usuario = usuario;
        this.createdAt = createdAt ?? new Date().toISOString();
    }

    /** Serializa para almacenar en req.session.user */
    toJSON() {
        return {
            id: this.id,
            usuario: this.usuario,
            createdAt: this.createdAt
        };
    }

    /**
     * Reconstruye un UserSession a partir de los datos guardados en la sesión.
     * @param {Object|null} data
     * @returns {UserSession|null}
     */
    static from(data) {
        if (!data) return null;
        return new UserSession(data);
    }
}

// =======================================
// Configuración del middleware de sesión
// =======================================

const rawConfig = JSON.parse(
    fs.readFileSync(new URL("./config/sessionConfig.json", import.meta.url), "utf-8")
);

const config = resolveValue(rawConfig);
const PgSession = connectPg(session);

const sessionStore = {
    store: new PgSession({
        pool: db.pool,
        tableName: config.store.tableName
    }),
    secret: config.secret,
    resave: config.resave,
    saveUninitialized: config.saveUninitialized,
    cookie: {
        maxAge: Number(config.cookie.maxAge),
        secure: config.cookie.secure,
        httpOnly: config.cookie.httpOnly,
        sameSite: config.cookie.sameSite
    }
};

const sessionMiddleware = session(sessionStore);

// =================
// SessionComponent 
// =================

class SessionComponent {
    constructor(app) {
        app.use(sessionMiddleware);
    }

    /**
     * Crea la sesión para el usuario.
     * Instancia un UserSession y lo serializa en req.session.user.
     * @param {import("express").Request} req
     * @param {{ id: number, usuario: string }} data
     * @returns {UserSession}
     */
    createSession(req, data) {
        const userSession = new UserSession(data);
        req.session.user = userSession.toJSON();
        return userSession;
    }

    // Verifica si existe sesión
    sessionExist(req) {
        return !!req.session.user;
    }

    // Destruye la sesión
    destroySession(req, res) {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Error al cerrar sesión"
                });
            }

            res.clearCookie("connect.sid");
            res.json({
                success: true,
                message: "Sesión cerrada"
            });
        });
    }

    // Agrega o actualiza datos en la sesión
    setDataSession(req, data) {
        if (!this.sessionExist(req)) return false;

        req.session.user = {
            ...req.session.user,
            ...data
        };
        return true;
    }

    // Obtiene los datos de la sesión como UserSession (o null)
    getSession(req) {
        return UserSession.from(req.session.user ?? null);
    }

    // Middleware de autenticación
    authenticate() {
        return (req, res, next) => {
            if (!this.sessionExist(req)) {
                return res.status(401).json({
                    success: false,
                    message: "No autorizado"
                });
            }
            next();
        };
    }
}

export { SessionComponent };
export default sessionMiddleware;