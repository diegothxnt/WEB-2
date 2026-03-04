import session from "express-session";
import connectPg from "connect-pg-simple";
import dotenv from "dotenv";
import fs from "fs";
import db from "./db/db.js";
dotenv.config();

const rawConfig = JSON.parse(
    fs.readFileSync(new URL("./config/sessionConfig.json", import.meta.url), "utf-8")
);

function resolveValue(value){
    if (typeof value === "string"){
        const envMatch = value.match(/^\$\{([^:}]+)(?::([^}]+))?\}$/);
        if (envMatch) {
            const key = envMatch[1];
            const def = envMatch[2];
            return process.env[key];
        }
        return value;
    }
    if (Array.isArray(value)) return value.map(resolveValue);
    if (value && typeof value === "object") {
        const out = {};
        for (const k of Object.keys(value)) out[k] = resolveValue(value[k]);
        return out;
    }
    return value;
}

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

class SessionComponent {
    constructor(app) {
        app.use(sessionMiddleware);
    }

    // Crea la sesión
    createSession(req, data) {
        req.session.data = data;
    }

    // Verifica si existe sesión
    sessionExist(req) {
        return !!req.session.data;
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

        req.session.data = {
            ...req.session.data,
            ...data
        };
        return true;
    }

    // Obtiene los datos de la sesión
    getSession(req) {
        return req.session.data || null;
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