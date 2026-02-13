/**
 * @file Middleware de autenticación
 */

/**
 * Verifica si hay sesión de usuario
 */
export function ensureAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: "No autorizado" });
}
