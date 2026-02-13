const session = require("express-session");

class SessionComponent {
    constructor(app) {
        app.use(
            session({
                secret: "mi_secreto_seguro",
                resave: false,
                saveUninitialized: false,
                cookie: {
                    secure: false, // true en producción con HTTPS
                    maxAge: 5 * 60 * 1000 // 5 minutos
                }
            })
        );
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

module.exports = SessionComponent;
