/**
 * @file Rutas de usuario
 */

import { Router } from "express";
import { profileController } from "../controllers/userController.js";
import Dispatcher from "../dispatcher.js";
const router = Router();

router.get(
    "/me",
    new Dispatcher({
        action: "profile",
        requiresAuth: true,
        handler: profileController
    }).middleware()
);

export default router;
