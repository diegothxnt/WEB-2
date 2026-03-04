/**
 * @file Rutas de autenticación
 */

import { Router } from "express";
import {
  loginController,
  logoutController,
  registerController
} from "../controllers/authController.js";
import Dispatcher  from "../dispatcher.js";

const router = Router();

router.post(
  "/login",
  new Dispatcher({
    action: "login",
    requiresAuth: false,
    handler: loginController
  }).middleware()
);

router.post(
  "/logout",
  new Dispatcher({
    action: "logout",
    requiresAuth: true,
    handler: logoutController
  }).middleware()
);

router.post(
  "/register",
  new Dispatcher({
    action: "register",
    requiresAuth: false,
    handler: registerController
  }).middleware()
);

export default router;
