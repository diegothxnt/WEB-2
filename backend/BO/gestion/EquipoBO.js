/**
 * @file BO/gestion/EquipoBO.js
 * atx: 40 listarEstado | 41 actualizarEstado
 */

import db      from "../../db/db.js";
import queries from "../../sql/equipo.queries.json" with { type: "json" };

export default class EquipoBO {

    async listarEstado(_params, _req) {
        const result = await db.query(queries.listarEstado.text, []);
        return result.rows;
    }

    /**
     * params[0] = { id_item, id_estado_item }
     */
    async actualizarEstado(params, _req) {
        const { id_item, id_estado_item } = params[0] ?? {};
        if (!id_item || !id_estado_item) throw new Error("id_item e id_estado_item requeridos");

        const result = await db.query(queries.actualizarEstado.text, [id_estado_item, id_item]);
        if (!result.rowCount) throw new Error(`Ítem ${id_item} no encontrado`);

        return result.rows[0];
    }
}
