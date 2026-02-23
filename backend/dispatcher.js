/**
 * @file Dispatcher para manejar sesiones y seguridad
 */

import { Result } from "pg";

/**
 * Ejecuta una accion controlando errores y asegurando autenticacion
 * 
 * @param {Object} options
 * @param {string} options.action - Nombre de la accion
 * @param {boolean} options.requiresAuth - Si la accion requiere autenticacion
 * @param {Function} options.handler - Funcion que maneja la accion
 * @return {Function} Middleware de Express
 */

export function dispatcher({ action, requiresAuth = false, handler }) {
    return async (req, res, next) => {
        try {
            // Validar sesion
            if (requiresAuth && !req.session?.user) {
                return res.status(401).json({
                    success: false,
                    message: "No autorizado"
                });
            }
            
            // Ejecutar handler
            const result = await handler(req, res, next);

            if (req.session) {
                await new Promise((resolve, reject) => {
                    req.session.save(err => err ? reject(err) : resolve());
                }).catch(err => {
                console.error("[dispatcher] error saving session:", err);
                });
            }

            return result;
        } catch (error) {
            console.error(`[Dispatcher] Error en accion ${action}:`, error);
            return res.status(500).json({
                success: false,
                message: "Error interno del servidor"
            });
        }
    }
}