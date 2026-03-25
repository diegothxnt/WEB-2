/**
 * @file BO/gestion/UbicacionBO.js
 * atx: 50 listar | 51 actualizar
 */

import db      from "../../db/db.js";
import queries from "../../sql/ubicacion.queries.json" with { type: "json" };

export default class UbicacionBO {

    async listar(_params, _req) {
        const result = await db.query(queries.listar.text, []);
        return result.rows;
    }

    /**
     * params[0] = { id_ubicacion, nombre }
     */
    async actualizar(params, _req) {
        const { id_ubicacion, nombre } = params[0] ?? {};
        if (!id_ubicacion || !nombre) throw new Error("id_ubicacion y nombre requeridos");

        const result = await db.query(queries.actualizar.text, [nombre, id_ubicacion]);
        if (!result.rowCount) throw new Error(`Ubicación ${id_ubicacion} no encontrada`);

        return result.rows[0];
    }
}
