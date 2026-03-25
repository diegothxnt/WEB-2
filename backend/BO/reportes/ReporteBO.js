/**
 * @file BO/reportes/ReporteBO.js
 * atx: 70 solvencia | 71 morosos | 72 estadisticas
 */

import db      from "../../db/db.js";
import queries from "../../sql/reporte.queries.json" with { type: "json" };

export default class ReporteBO {

    async solvencia(_params, _req) {
        const result = await db.query(queries.solvencia.text, []);
        return result.rows;
    }

    async morosos(_params, _req) {
        const result = await db.query(queries.morosos.text, []);
        return result.rows;
    }

    async estadisticas(_params, _req) {
        const result = await db.query(queries.estadisticas.text, []);
        return result.rows[0];
    }
}
