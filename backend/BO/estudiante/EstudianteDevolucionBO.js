/**
 * @file BO/estudiante/EstudianteDevolucionBO.js
 * atx: 103 verMisDevoluciones
 *
 * El estudiante solo puede ver sus propias devoluciones.
 */

import db      from "../../db/db.js";
import queries from "../../sql/estudiante.queries.json" with { type: "json" };

export default class EstudianteDevolucionBO {

    async verMisDevoluciones(_params, req) {
        const result = await db.query(queries.misDevoluciones.text, [req.session.user.id]);
        return result.rows;
    }
}
