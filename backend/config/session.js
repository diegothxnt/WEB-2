/**
 * @file Configuración de sesiones con PostgreSQL
 */

import session from "express-session";
import connectPg from "connect-pg-simple";
import dotenv from "dotenv";
import db from "../db/db.js";
dotenv.config();

const PgSession = connectPg(session);

const sessionMiddleware = session({
  store: new PgSession({
    pool: db.pool,
    tableName: process.env.SESSION_TABLE
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE),
    secure: false,
    httpOnly: true
  }
});

export default sessionMiddleware;
