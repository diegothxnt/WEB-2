/**
 * @file BO/estudiante/EstudiantePrestamoBO.js
 * atx: 100 verDisponibles | 101 solicitar | 102 verMisPrestamos
 *
 * Solo accede a los ítems disponibles (operativos, con stock > 0).
 * El estudiante no ve el inventario completo.
 */

import db      from "../../db/db.js";
import queries from "../../sql/estudiante.queries.json" with { type: "json" };

export default class EstudiantePrestamoBO {

    async verDisponibles(_params, _req) {
        const result = await db.query(queries.itemsDisponibles.text, []);
        return result.rows;
    }

    /**
     * params[0] = { periodo, fecha_inicio, fecha_fin, modalidad }
     * params[1] = [{ id_inventario, cantidad }, ...]
     */
    async solicitar(params, req) {
        const { periodo, fecha_inicio, fecha_fin, modalidad = "dias" } = params[0] ?? {};
        const detalles   = params[1] ?? [];
        const id_usuario = req.session.user.id;

        if (!periodo || !detalles.length) {
            throw new Error("Periodo y al menos un ítem son requeridos");
        }

        // Verificar que todos los ítems solicitados están disponibles
        for (const d of detalles) {
            const check = await db.query(
                "SELECT cantidad FROM inventario WHERE id_inventario = $1",
                [d.id_inventario]
            );
            if (!check.rows.length || check.rows[0].cantidad < d.cantidad) {
                throw new Error(`Stock insuficiente para el ítem solicitado`);
            }
        }

        const movRes = await db.query(queries.solicitar.text, [
            id_usuario, periodo, fecha_inicio ?? null, fecha_fin ?? null, modalidad
        ]);
        const movimiento = movRes.rows[0];

        for (const d of detalles) {
            await db.query(queries.reducirInventario.text, [d.cantidad, d.id_inventario]);
            await db.query(queries.crearDetallePrestamo.text, [
                movimiento.id_movimiento, d.id_inventario, d.cantidad
            ]);
        }

        return movimiento;
    }

    async verMisPrestamos(_params, req) {
        const result = await db.query(queries.misPrestamos.text, [req.session.user.id]);
        return result.rows;
    }
}
