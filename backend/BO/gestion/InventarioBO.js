/**
 * @file BO/gestion/InventarioBO.js
 * atx: 30 listar | 31 actualizar
 */

import db      from "../../db/db.js";
import queries from "../../sql/inventario.queries.json" with { type: "json" };

export default class InventarioBO {

    async listar(_params, _req) {
        const result = await db.query(queries.listar.text, []);
        return result.rows;
    }

    /**
     * params[0] = { id_inventario, cantidad, id_ubicacion }
     */
    async actualizar(params, _req) {
        const { id_inventario, cantidad, id_ubicacion } = params[0] ?? {};
        if (!id_inventario) throw new Error("id_inventario requerido");

        const result = await db.query(queries.actualizar.text, [cantidad, id_ubicacion, id_inventario]);
        if (!result.rowCount) throw new Error(`Registro de inventario ${id_inventario} no encontrado`);

        return result.rows[0];
    }
}
