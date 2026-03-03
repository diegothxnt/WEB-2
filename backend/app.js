/**
 * @file Configuración y middlewares del servidor
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import sessionMiddleware from "./config/session.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
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

// Sesiones
app.use(sessionMiddleware);

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Servir frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Endpoint de prueba
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

export default app;
