/**
 * @file Inicializa y levanta el servidor leyendo desde config.json
 */

import app from "./app.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 1. Leemos el config.json para obtener el puerto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rawConfig = fs.readFileSync(path.join(__dirname, "config", "config.json"), "utf8");
const config = JSON.parse(rawConfig);

// 2. Extraemos el puerto (por defecto usa el del JSON, o 4000 de respaldo)
const PORT = config.server.port || 4000;

// 3. Levantamos el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo sin .env en http://localhost:${PORT}`);
});