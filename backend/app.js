/**
 * @file app.js
 * Configuración, middlewares y rutas del servidor.
 */

import express from "express";
import cors    from "cors";
import helmet  from "helmet";
import path    from "path";
import { fileURLToPath } from "url";

import sessionMiddleware from "./session.js";
import security          from "./security.js";
import userRoutes        from "./routes/userRoutes.js";
import authRoutes        from "./routes/authRoutes.js";

const app        = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Middlewares generales ───────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Sesiones ────────────────────────────────────────────────────
app.use(sessionMiddleware);

// ─── Rutas de infraestructura ────────────────────────────────────
app.use("/api/auth",  authRoutes);
app.use("/api/users", userRoutes);

// ─── toProcess ───────────────────────────────────────────────────
/**
 * Endpoint central para ejecutar operaciones de negocio.
 *
 * Body: { atx: number, params: any[] }
 *
 * Flujo:
 *   1. Verificar sesión activa
 *   2. Validar que el atx existe en el mapa de transacciones
 *   3. Verificar permiso del perfil del usuario para ese atx
 *   4. Ejecutar el método de la clase de negocio por reflexión
 */
app.post("/api/toProcess", async (req, res) => {

    // 1. Verificar sesión
    if (!req.session?.user) {
        return res.status(401).json({ success: false, message: "No autorizado — sesión requerida" });
    }

    const { atx, params = [] } = req.body;

    if (atx === undefined || atx === null) {
        return res.status(400).json({ success: false, message: "Falta el identificador de transacción (atx)" });
    }

    // 2. Buscar transacción en el mapa
    if (!security.atxExists(atx)) {
        return res.status(404).json({ success: false, message: `Transacción ${atx} no encontrada` });
    }

    const txData  = security.getTransaction(atx);
    
    // Perfil del usuario — leído en el login desde usuario_perfil.
    // Fallback 'estudiante' (perfil de menor privilegio) si por alguna razón no está en sesión.
    const profile = req.session.user.profile ?? "estudiante";
    const userId  = req.session.user.id;

    // 3. Verificar permiso del perfil sobre el atx
    if (!await security.hasPermission(profile, atx, userId)) {
        return res.status(403).json({ success: false, message: "Sin permiso para ejecutar esta transacción" });
    }

    // 4. Ejecutar método por reflexión
    try {
        await security.exeMethod(txData, params, req, res);
    } catch (err) {
        console.error("[toProcess] Error inesperado:", err);
        return res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
});

// ─── Servir frontend estático ────────────────────────────────────
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

export default app;
