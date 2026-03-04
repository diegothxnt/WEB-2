/**
 * @file Dispatcher para manejar sesiones y seguridad
 */

/**
 * Ejecuta una accion controlando errores y asegurando autenticacion
 * 
 * @param {Object} options
 * @param {string} options.action - Nombre de la accion
 * @param {boolean} options.requiresAuth - Si la accion requiere autenticacion
 * @param {Function} options.handler - Funcion que maneja la accion
 * @return {Function} Middleware de Express
 */

export class Dispatcher {
    constructor({ action, requiresAuth = false, handler }) {
        this.action = action;
        this.requiresAuth = requiresAuth;
        this.handler = handler;
    }

    async handle(req, res, next) {
        try {
            // Validar sesion
            if (this.requiresAuth && !req.session?.user) {
                return res.status(401).json({
                    success: false,
                    message: "No autorizado"
                });
            }
            
            // Ejecutar handler
            const result = await this.handler(req, res, next);

            if (req.session) {
                await new Promise((resolve, reject) => {
                    req.session.save(err => err ? reject(err) : resolve());
                }).catch(err => {
                console.error("[Dispatcher] error saving session:", err);
                });
            }

            return result;
        } catch (error) {
            console.error(`[Dispatcher] Error en accion ${this.action}:`, error);
            return res.status(500).json({
                success: false,
                message: "Error interno del servidor"
            });
        }
    }

    middleware() {
        return this.handle.bind(this);
    }
}

export default Dispatcher;