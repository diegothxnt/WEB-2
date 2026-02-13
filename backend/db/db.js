/**
 * @file Conexión singleton a PostgreSQL
 */

import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

class Database {
  constructor() {
    if (Database.instance) return Database.instance;

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    Database.instance = this;
  }

  /**
   * Ejecuta un query en la base de datos.
   * @param {string} text SQL query
   * @param {Array} params Parámetros de consulta
   * @returns {Promise}
   */
  query(text, params) {
    return this.pool.query(text, params);
  }
}

export default new Database();
