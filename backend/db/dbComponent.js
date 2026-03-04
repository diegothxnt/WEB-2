
/**
 * @file dbComponent.js - Conexión singleton a PostgreSQL usando config.json
 */

import pg from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import resolveValue from "../utils/resolveValue.js";
dotenv.config();

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawConfig = JSON.parse(
    fs.readFileSync(new URL("./config/dbComponentConfig.json", import.meta.url), "utf-8")
);

class DbComponent {
  constructor() {
    // Patron singleton
    if (DbComponent.instance) {
        return DbComponent.instance;
    }

    // Resolver config con variables de entorno
    const config = resolveValue(rawConfig);
    const connectionString = process.env.DATABASE_URL;

    // Configurar pool de conexiones
    const poolConfig = connectionString 
        ? { connectionString }
        : {
            user: config.database.user,
            password: config.database.password,
            host: config.database.host,
            port: config.database.port,
            database: config.database.name,
            ssl: 
                config.database.ssl && `${config.database.ssl}`.toLowerCase() !== "false"
                    ? { rejectUnauthorized: false }
                    : false
        }
    
    // Crear pool de conexiones
    this.pool = new Pool(poolConfig);
    
    // Guardar instancia
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

const db = new DbComponent();
export default db;
