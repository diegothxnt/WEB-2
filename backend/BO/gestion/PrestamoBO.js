/**
 * @file BO/gestion/PrestamoBO.js
 * Business Object — Gestión de préstamos (vista admin/head_admin).
 * atx: 10 listar | 11 crear | 12 anular | 13 modificarFecha
 */

import db      from "../../db/db.js";
import queries from "../../sql/prestamo.queries.json" with { type: "json" };

export default class PrestamoBO {

    async listar(_params, _req) {
        const result = await db.query(queries.listar.text, []);
        return result.rows;
    }

    /**
     * params[0] = { periodo, fecha_inicio, fecha_fin, modalidad, id_usuario }
     * params[1] = [{ id_inventario, cantidad }, ...]
     */
    async crear(params, req) {
        const { periodo, fecha_inicio, fecha_fin, modalidad = "dias", id_usuario } = params[0] ?? {};
        const detalles   = params[1] ?? [];
        const usuarioId  = id_usuario ?? req.session.user.id;

        if (!periodo || !detalles.length) {
            throw new Error("Periodo y al menos un ítem son requeridos");
        }

        const movRes = await db.query(queries.crear.text, [
            usuarioId, periodo, fecha_inicio ?? null, fecha_fin ?? null, modalidad
        ]);
        const movimiento = movRes.rows[0];

        for (const d of detalles) {
            const invRes = await db.query(queries.reducirInventario.text, [d.cantidad, d.id_inventario]);
            if (!invRes.rowCount) {
                throw new Error(`Stock insuficiente para inventario ${d.id_inventario}`);
            }
            await db.query(queries.crearDetalle.text, [movimiento.id_movimiento, d.id_inventario, d.cantidad]);
        }

        return movimiento;
    }

    /**
     * params[0] = id_movimiento
     */
    async anular(params, _req) {
        const id_movimiento = params[0];
        if (!id_movimiento) throw new Error("id_movimiento requerido");

        const detalles = await db.query(queries.detallesPorMovimiento.text, [id_movimiento]);
        for (const d of detalles.rows) {
            await db.query(queries.restaurarInventario.text, [d.cantidad, d.id_inventario]);
        }

        const result = await db.query(queries.anular.text, [id_movimiento]);
        if (!result.rowCount) throw new Error(`Préstamo ${id_movimiento} no encontrado`);

        return { anulado: true, id_movimiento };
    }

    /**
     * params[0] = { id_movimiento, fecha_fin }
     */
    async modificarFecha(params, _req) {
        const { id_movimiento, fecha_fin } = params[0] ?? {};
        if (!id_movimiento || !fecha_fin) throw new Error("id_movimiento y fecha_fin requeridos");

        const result = await db.query(queries.modificarFecha.text, [fecha_fin, id_movimiento]);
        if (!result.rowCount) throw new Error(`Préstamo ${id_movimiento} no encontrado`);

        return result.rows[0];
    }
}
