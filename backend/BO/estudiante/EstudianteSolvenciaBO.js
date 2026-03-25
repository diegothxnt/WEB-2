/**
 * @file BO/estudiante/EstudianteSolvenciaBO.js
 * atx: 104 verSolvencia | 105 pagarAmonestacion
 */

import db      from "../../db/db.js";
import queries from "../../sql/estudiante.queries.json" with { type: "json" };

export default class EstudianteSolvenciaBO {

    async verSolvencia(_params, req) {
        const result = await db.query(queries.miSolvencia.text, [req.session.user.id]);
        return result.rows;
    }

    /**
     * Registra el comprobante de pago del estudiante.
     * Un admin deberá verificarlo manualmente con AmonestacionBO.verificarPago.
     *
     * params[0] = { id_amonestacion, numero_transferencia, monto }
     */
    async pagarAmonestacion(params, req) {
        const { id_amonestacion, numero_transferencia, monto } = params[0] ?? {};
        const id_usuario = req.session.user.id;

        if (!id_amonestacion || !numero_transferencia || !monto) {
            throw new Error("id_amonestacion, numero_transferencia y monto son requeridos");
        }

        // Verificar que la amonestación le pertenece y no está pagada
        const amonRes = await db.query(queries.amonestacionPorId.text, [id_amonestacion, id_usuario]);
        if (!amonRes.rows.length) throw new Error("Amonestación no encontrada");
        if (amonRes.rows[0].pagada) throw new Error("Esta amonestación ya está pagada");

        // Verificar que no haya un pago pendiente de verificación
        const pagoExiste = await db.query(queries.pagoExistente.text, [id_amonestacion]);
        if (pagoExiste.rows.length) {
            throw new Error("Ya existe un comprobante enviado. Espera la verificación del administrador");
        }

        const result = await db.query(queries.registrarPago.text, [
            id_amonestacion, numero_transferencia, monto
        ]);

        return result.rows[0];
    }
}
