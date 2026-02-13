/**
 * @file Controladores de usuario
 */

export function profileController(req, res) {
  return res.json({ user: req.session.user });
}
