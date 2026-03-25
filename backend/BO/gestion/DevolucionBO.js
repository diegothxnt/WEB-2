/**
 * @file BO/gestion/DevolucionBO.js
 * Business Object — Gestión de devoluciones (vista admin/head_admin).
 * atx: 20 registrar | 21 listar
 *
 * Al registrar, calcula si hay retraso y crea una amonestación automáticamente.
 * Horario del laboratorio: L-V 7:30–16:00.
 * Devolución después de las 16:00 se cuenta como día siguiente.
 * Multa: $2.00 por día hábil de retraso.
 */

import db      from "../../db/db.js";
import queries from "../../sql/devolucion.queries.json" with { type: "json" };
import qAmon   from "../../sql/amonestacion.queries.json" with { type: "json" };

const MONTO_POR_DIA  = 2.00;
const HORA_LIMITE    = 16;

/**
 * Cuenta días hábiles (L-V) entre dos fechas, excluyendo la fecha de inicio.
 * Si la devolución es después de las 16:00, se trata como el día siguiente.
 */
function diasHabilesRetraso(fechaFin, fechaDevolucion) {
    const fin = new Date(fechaFin);
    const dev = new Date(fechaDevolucion);

    // Si devuelven después de las 16:00, contar como día siguiente
    if (dev.getHours() >= HORA_LIMITE) {
        dev.setDate(dev.getDate() + 1);
        dev.setHours(8, 0, 0, 0);
    }

    if (dev <= fin) return 0;

    let dias  = 0;
    const cur = new Date(fin);
    cur.setDate(cur.getDate() + 1);
    cur.setHours(8, 0, 0, 0);

    while (cur <= dev) {
        const dow = cur.getDay(); // 0=Dom, 6=Sab
        if (dow !== 0 && dow !== 6) dias++;
        cur.setDate(cur.getDate() + 1);
    }

    return dias;
}

export default class DevolucionBO {

    async listar(_params, _req) {
        const result = await db.query(queries.listar.text, []);
        return result.rows;
    }

    /**
     * params[0] = { id_movimiento_prestamo, periodo }
     *   (el id del préstamo original para poder calcular el retraso)
     * params[1] = [{ id_inventario, cantidad, id_estado_devolucion }, ...]
     */
    async registrar(params, req) {
        const { id_movimiento_prestamo, periodo } = params[0] ?? {};
        const detalles   = params[1] ?? [];
        const id_usuario = req.session.user.id;

        if (!periodo || !detalles.length) {
            throw new Error("Periodo y al menos un ítem son requeridos");
        }

        // Crear movimiento de devolución
        const movRes = await db.query(queries.registrar.text, [id_usuario, periodo]);
        const devolucion = movRes.rows[0];

        // Insertar detalles y restaurar inventario
        for (const d of detalles) {
            await db.query(queries.crearDetalle.text, [
                devolucion.id_movimiento,
                d.id_inventario,
                d.cantidad,
                d.id_estado_devolucion ?? null
            ]);
            await db.query(queries.restaurarInventario.text, [d.cantidad, d.id_inventario]);
        }

        // Verificar si hay retraso respecto al préstamo original
        let amonestacion = null;
        if (id_movimiento_prestamo) {
            const prestamos = await db.query(queries.prestamosActivosPorUsuario.text, [id_usuario]);
            const prestamo  = prestamos.rows.find(p => p.id_movimiento === id_movimiento_prestamo);

            if (prestamo?.fecha_fin) {
                const dias = diasHabilesRetraso(prestamo.fecha_fin, devolucion.fecha ?? new Date());

                if (dias > 0) {
                    const monto       = +(dias * MONTO_POR_DIA).toFixed(2);
                    const descripcion = `Retraso de ${dias} día(s) hábil(es) en la devolución. Monto: $${monto}`;

                    const amonRes = await db.query(qAmon.crearAutomatica.text, [
                        id_movimiento_prestamo,
                        id_usuario,
                        dias,
                        monto,
                        descripcion
                    ]);
                    amonestacion = amonRes.rows[0];
                }
            }
        }

        return { devolucion, amonestacion };
    }
}
