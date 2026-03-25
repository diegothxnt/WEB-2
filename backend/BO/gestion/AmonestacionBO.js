/**
 * @file BO/gestion/AmonestacionBO.js
 * atx: 65 asignar | 66 listar | 67 verificarPago
 */

import db      from "../../db/db.js";
import queries from "../../sql/amonestacion.queries.json" with { type: "json" };

export default class AmonestacionBO {

    async listar(_params, _req) {
        const result = await db.query(queries.listar.text, []);
        return result.rows;
    }

    /**
     * params[0] = { id_movimiento, id_usuario, tipo, dias_retraso, monto, descripcion }
     * tipo: 'retraso' | 'estravio' | 'danio' | 'otro'
     */
    async asignar(params, _req) {
        const { id_movimiento, id_usuario, tipo = "otro", dias_retraso = 0, monto, descripcion } = params[0] ?? {};

        if (!id_movimiento || !id_usuario || !monto) {
            throw new Error("id_movimiento, id_usuario y monto son requeridos");
        }

        const result = await db.query(queries.asignar.text, [
            id_movimiento, id_usuario, tipo, dias_retraso, monto, descripcion ?? null
        ]);

        return result.rows[0];
    }

    /**
     * Verifica el comprobante de pago subido por el estudiante
     * y marca la amonestación como pagada.
     *
     * params[0] = { id_pago }
     */
    async verificarPago(params, req) {
        const { id_pago } = params[0] ?? {};
        if (!id_pago) throw new Error("id_pago requerido");

        const id_verificador = req.session.user.id;

        // Actualizar el registro de pago
        const pagoRes = await db.query(queries.verificarPago.text, [id_verificador, id_pago]);
        if (!pagoRes.rowCount) throw new Error(`Pago ${id_pago} no encontrado`);

        // Marcar la amonestación como pagada
        await db.query(queries.marcarPagada.text, [pagoRes.rows[0].id_amonestacion]);

        return { verificado: true, id_pago };
    }
}
