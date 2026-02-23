/**
 * @file Controladores de autenticación
 */

import { createUsuario, findUsuario } from "../models/usuarioModel.js";
import { createPersona } from "../models/personaModel.js";
import bcrypt from "bcrypt";

/**
 * POST /api/auth/register
 */
export async function registerController(req, res) {
  try {
    const { nombre, cedula, correo, usuario, contrasena } = req.body;

    // Crear persona
    const persona = await createPersona({ nombre, cedula, correo });

    // Crear usuario
    const user = await createUsuario({
      id_persona: persona.id_persona,
      usuario,
      contrasena
    });

    return res.status(201).json({ user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/auth/login
 */
export async function loginController(req, res) {
  try {
    const { usuario, contrasena } = req.body;
    const user = await findUsuario(usuario);

    if (!user) return res.status(400).json({ error: "usuario o contrasena incorrectos" });

    const ok = await bcrypt.compare(contrasena, user.contrasena);
    if (!ok) return res.status(400).json({ error: "usuario o contraseña incorrectos" });

    // Guardar en sesión
    req.session.user = {
      id: user.id_usuario,
      usuario: user.usuario
    };

    req.session.save(err => {
      if (err) {
        console.error("Error guardando sesion:", err);
        return res.status(500).json({ error: "Error al guardar la sesion" });
      }
      return res.json({ message: "Autenticado" });
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/auth/logout
 */
export function logoutController(req, res) {
  // Forzar expiración de la cookie
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    expires: new Date(0)
  };
  req.session?.destroy?.(() => {
    res.clearCookie("connect.sid", cookieOptions);
    return res.json({ message: "Sesión finalizada" });
  }) ?? (function() {
    res.clearCookie("connect.sid", cookieOptions);
    return res.json({ message: "Sesión finalizada" });
  })();
}
