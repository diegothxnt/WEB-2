/**
 * @file Dispatcher — singleton del servidor para despachar acciones con control de autenticación
 *
 * Se instancia una vez cuando el módulo es importado (al levantar el servidor).
 * Las rutas usan dispatcher.dispatch(...) en lugar de instanciar Dispatcher por ruta.
 */

export class Dispatcher {
    #registeredActions = new Map();

    /**
     * Registra la accion y retorna el middleware de Express correspondiente.
     *
     * @param {Object}   options
     * @param {string}   options.action       - Nombre identificador de la accion
     * @param {boolean}  options.requiresAuth - Si la accion requiere sesion activa
     * @param {Function} options.handler      - Controller (req, res, next) => ...
     * @returns {Function} Middleware de Express
     */
    dispatch({ action, requiresAuth = false, handler }) {
        this.#registeredActions.set(action, { requiresAuth, handler });

        return async (req, res, next) => {
            try {
                if (requiresAuth && !req.session?.user) {
                    return res.status(401).json({
                        success: false,
                        message: "No autorizado"
                    });
                }

                const result = await handler(req, res, next);

                if (req.session) {
                    await new Promise((resolve, reject) => {
                        req.session.save(err => (err ? reject(err) : resolve()));
                    }).catch(err => {
                        console.error(`[Dispatcher] Error guardando sesion para accion "${action}":`, err);
                    });
                }

                return result;
            } catch (error) {
                console.error(`[Dispatcher] Error en accion "${action}":`, error);
                return res.status(500).json({
                    success: false,
                    message: "Error interno del servidor"
                });
            }
        };
    }

    // Retorna la lista de acciones registradas (útil para depuración)
    getRegisteredActions() {
        return [...this.#registeredActions.keys()];
    }
}

// Singleton
const dispatcher = new Dispatcher();
export default dispatcher;