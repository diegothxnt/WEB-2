/**
 * @file Rutas de usuario
 */

import { Router } from "express";
import { ensureAuth } from "../middlewares/authMiddleware.js";
import { profileController } from "../controllers/userController.js";

const router = Router();

router.get("/me", ensureAuth, profileController);

export default router;
