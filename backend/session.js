/**
 * @file Manejo de sesiones leyendo desde config.json
 */

import session from "express-session";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Entramos a la carpeta 'config' para leer el JSON
const rawConfig = fs.readFileSync(path.join(__dirname, "config", "config.json"), "utf8");
const config = JSON.parse(rawConfig);

// 2. Configuramos y exportamos el middleware por defecto para app.js
const sessionMiddleware = session({
    secret: config.session.secret, // Viene del JSON
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Cambiar a true en producción si usas HTTPS
        maxAge: config.session.maxAge // Viene del JSON (300000 = 5 min)
    }
});

export default sessionMiddleware;

// 3. Mantenemos tu clase SessionComponent por si usas sus métodos en controladores
export class SessionComponent {
    createSession(req, data) {
        req.session.data = data;
    }

    sessionExist(req) {
        return !!req.session.data;
    }

    destroySession(req, res) {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ success: false, message: "Error al cerrar sesión" });
            }
            res.clearCookie("connect.sid");
            res.json({ success: true, message: "Sesión cerrada" });
        });
    }

    setDataSession(req, data) {
        if (!this.sessionExist(req)) return false;
        req.session.data = { ...req.session.data, ...data };
        return true;
    }

    getSession(req) {
        return req.session.data || null;
    }

    authenticate() {
        return (req, res, next) => {
            if (!this.sessionExist(req)) {
                return res.status(401).json({ success: false, message: "No autorizado" });
            }
            next();
        };
    }
}