/**
 * @file BO/gestion/NotificacionBO.js
 * atx: 60 listar | 61 enviar
 *
 * listar: estudiante ve solo las suyas; admin/head_admin ven todas.
 */

import db      from "../../db/db.js";
import queries from "../../sql/notificacion.queries.json" with { type: "json" };

export default class NotificacionBO {

    async listar(_params, req) {
        const { id, profile } = req.session.user;

        if (profile === "estudiante") {
            const result = await db.query(queries.listarPorUsuario.text, [id]);
            return result.rows;
        }

        const result = await db.query(queries.listarTodas.text, []);
        return result.rows;
    }

    /**
     * params[0] = { id_usuario, mensaje }
     *   id_usuario: destinatario (admin lo elige; puede ser un arreglo para envío masivo)
     */
    async enviar(params, _req) {
        const { id_usuario, mensaje } = params[0] ?? {};
        if (!mensaje) throw new Error("mensaje requerido");

        // Soporte para envío a un usuario o a un array de usuarios
        const destinatarios = Array.isArray(id_usuario) ? id_usuario : [id_usuario];

        const enviadas = [];
        for (const uid of destinatarios) {
            const result = await db.query(queries.enviar.text, [uid, mensaje]);
            enviadas.push(result.rows[0]);
        }

        return enviadas;
    }
}
