/**
 * @file Modelo para persona (usa SQL desde queries.json)
 */

import db from "../db/db.js";
import queries from "../sql/queries.json" with { type: "json" };

/**
 * Crea persona en la base de datos
 * @param {Object} datos
 */
export async function createPersona({ nombre, cedula, correo }) {
  const result = await db.query(
    queries.createPersona.text,
    [nombre, cedula, correo]
  );
  return result.rows[0];
}

/**
 * Busca persona por ID
 */
export async function findPersonaById(id) {
  const result = await db.query(
    queries.findPersonaById.text,
    [id]
  );
  return result.rows[0];
}
