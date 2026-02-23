/**
 * @file Rutas de usuario
 */

import { Router } from "express";
import { profileController } from "../controllers/userController.js";
import { dispatcher } from "../dispatcher.js";
const router = Router();

router.get(
    "/me",
    dispatcher({
    action: "profile",
    requiresAuth: true,
    handler: profileController
    })
);

export default router;
