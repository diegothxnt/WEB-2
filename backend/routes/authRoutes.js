/**
 * @file Rutas de autenticación
 */

import { Router } from "express";
import {
  loginController,
  logoutController,
  registerController
} from "../controllers/authController.js";
import { dispatcher } from "../dispatcher.js";

const router = Router();

router.post(
  "/login",
  dispatcher({
    action: "login",
    requiresAuth: false,
    handler: loginController
  })
);

router.post(
  "/logout",
    dispatcher({
    action: "logout",
    requiresAuth: true,
    handler: logoutController
  })
);

router.post(
  "/register",
    dispatcher({
    action: "register",
    requiresAuth: false,
    handler: registerController
  })
);

export default router;
