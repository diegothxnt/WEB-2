/**
 * @file Modelo para usuario (usa SQL desde queries.json)
 */

import db from "../db/db.js";
import bcrypt from "bcryptjs";
import queries from "../sql/queries.json" with { type: "json" };

/**
 * Crea un usuario en la base de datos
 * @param {Object} datos
 */
export async function createUsuario({ id_persona, usuario, contrasena }) {
  const hashed = await bcrypt.hash(contrasena, 10);

  const result = await db.query(
    queries.createUsuario.text,
    [id_persona, usuario, hashed]
  );
  return result.rows[0];
}

/**
 * Busca usuario por username
 */
export async function findUsuario(username) {
  const result = await db.query(
    queries.findUsuarioByUsername.text,
    [username]
  );
  return result.rows[0];
}

/**
 * Busca usuario por ID
 */
export async function findUsuarioById(id) {
  const result = await db.query(
    queries.findUsuarioById.text,
    [id]
  );
  return result.rows[0];
}
