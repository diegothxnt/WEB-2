/**
 * @file BO/admin-usuarios/GestionUsuariosBO.js
 * atx: 200–205  Solo accesible por head_admin.
 */

import db      from "../../db/db.js";
import bcrypt  from "bcrypt";
import queries from "../../sql/admin-usuarios.queries.json" with { type: "json" };

export default class GestionUsuariosBO {

    async listar(_params, _req) {
        const result = await db.query(queries.listarUsuarios.text, []);
        return result.rows;
    }

    async listarPerfiles(_params, _req) {
        const result = await db.query(queries.listarPerfiles.text, []);
        return result.rows;
    }

    /**
     * params[0] = { id_usuario, id_perfil }
     */
    async asignarPerfil(params, _req) {
        const { id_usuario, id_perfil } = params[0] ?? {};
        if (!id_usuario || !id_perfil) throw new Error("id_usuario e id_perfil requeridos");

        const result = await db.query(queries.asignarPerfil.text, [id_usuario, id_perfil]);
        return result.rows[0];
    }

    /**
     * Crea un nuevo usuario y le asigna el perfil 'admin'.
     * params[0] = { nombre, cedula, correo, usuario, contrasena }
     */
    async crearAdmin(params, _req) {
        const { nombre, cedula, correo, usuario, contrasena } = params[0] ?? {};
        if (!nombre || !cedula || !correo || !usuario || !contrasena) {
            throw new Error("Todos los campos son requeridos");
        }

        const personaRes = await db.query(queries.crearPersona.text, [nombre, cedula, correo]);
        const persona    = personaRes.rows[0];

        const hashed    = await bcrypt.hash(contrasena, 10);
        const usuarioRes = await db.query(queries.crearUsuario.text, [persona.id_persona, usuario, hashed]);
        const nuevoUser  = usuarioRes.rows[0];

        // Asignar perfil admin automáticamente
        const perfilRes = await db.query(
            "SELECT id_perfil FROM perfil WHERE nombre = 'admin' LIMIT 1", []
        );
        if (!perfilRes.rows.length) throw new Error("Perfil 'admin' no encontrado en la BD");

        await db.query(queries.asignarPerfilNuevo.text, [nuevoUser.id_usuario, perfilRes.rows[0].id_perfil]);

        return { id_usuario: nuevoUser.id_usuario, usuario, nombre, perfil: "admin" };
    }

    /**
     * Concede o revoca un ATX específico para un usuario.
     * params[0] = { id_usuario, atx, puede_ejecutar }
     */
    async asignarPermisoOverride(params, _req) {
        const { id_usuario, atx, puede_ejecutar = true } = params[0] ?? {};
        if (!id_usuario || atx === undefined) throw new Error("id_usuario y atx requeridos");

        const result = await db.query(queries.upsertOverride.text, [id_usuario, atx, puede_ejecutar]);
        return result.rows[0];
    }

    /**
     * Elimina el override manual para un ATX específico del usuario
     * (el permiso vuelve a depender del perfil).
     * params[0] = { id_usuario, atx }
     */
    async removerPermisoOverride(params, _req) {
        const { id_usuario, atx } = params[0] ?? {};
        if (!id_usuario || atx === undefined) throw new Error("id_usuario y atx requeridos");

        const result = await db.query(queries.removerOverride.text, [id_usuario, atx]);
        if (!result.rowCount) throw new Error(`No existe override para usuario ${id_usuario}, atx ${atx}`);

        return { removido: true, id_usuario, atx };
    }
}
