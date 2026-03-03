/**
 * @file Configuración y middlewares del servidor
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import sessionMiddleware from "./session.js"; // Nuestra sesión conectada al JSON
import userRoutes from "./routes/userRoutes.js"; // Volvemos a tus rutas
import authRoutes from "./routes/authRoutes.js"; // Volvemos a tus rutas
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(helmet());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sesiones (Funcionando con config.json)
app.use(sessionMiddleware);

// ====================================================
// RUTAS TRADICIONALES
// Aquí es donde el dispatcher de Rainny hará su magia
// ====================================================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Servir frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Endpoint de prueba / Vista principal
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

export default app;