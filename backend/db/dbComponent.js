/**
 * @file dbComponent.js - Conexión singleton a PostgreSQL usando config.json
 */

import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DbComponent {
  constructor() {
    // 1. Mantenemos tu excelente patrón Singleton
    if (DbComponent.instance) {
        return DbComponent.instance;
    }

    // 2. Leemos el config.json en lugar de usar dotenv
    const configPath = path.join(__dirname, '../config/config.json');
    const rawConfig = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(rawConfig);

    // 3. Inicializamos el Pool con los datos del JSON
    this.pool = new Pool({
        user: config.database.user,
        host: config.database.host,
        database: config.database.database,
        password: config.database.password,
        port: config.database.port,
        ssl: config.database.ssl ? { rejectUnauthorized: false } : false // <--- ¡Esta línea es clave para Neon!
    });

    DbComponent.instance = this;
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

export default DbComponent;