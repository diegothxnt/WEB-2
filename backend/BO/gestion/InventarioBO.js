/**
 * @file BO/gestion/InventarioBO.js
 * atx: 30 listar | 31 actualizar | 32 crear | 33 eliminar
 *
 * CRUD sobre item + inventario.
 * - item: catálogo del equipo o componente
 * - inventario: registro físico con ubicación y cantidad
 */

import db      from "../../db/db.js";
import queries from "../../sql/inventario.queries.json" with { type: "json" };

export default class InventarioBO {

    async #withTransaction(work) {
        const client = await db.pool.connect();
        try {
            await client.query("BEGIN");
            const result = await work(client);
            await client.query("COMMIT");
            return result;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async listar(_params, _req) {
        const result = await db.query(queries.listar.text, []);
        return result.rows;
    }

    async listarCatalogos(_params, _req) {
        const [categorias, estados, ubicaciones, caracteristicas] = await Promise.all([
            db.query(queries.categoriasCatalogo.text, []),
            db.query(queries.estadosCatalogo.text, []),
            db.query(queries.ubicacionesCatalogo.text, []),
            db.query(queries.caracteristicasCatalogo.text, [])
        ]);

        return {
            categorias: categorias.rows,
            estados: estados.rows,
            ubicaciones: ubicaciones.rows,
            caracteristicas: caracteristicas.rows
        };
    }

    /**
     * Crea un item y su registro inicial en inventario.
     * params[0] = {
     *   nombre, descripcion, id_categoria, id_estado_item,
     *   id_ubicacion, cantidad,
     *   caracteristicas?: [{ id_caracteristica, valor }]
     * }
     */
    async crear(params, _req) {
        const {
            nombre,
            descripcion = null,
            id_categoria,
            id_estado_item,
            id_ubicacion,
            cantidad = 1,
            caracteristicas = []
        } = params[0] ?? {};

        if (!nombre || !id_categoria || !id_estado_item || !id_ubicacion) {
            throw new Error("nombre, id_categoria, id_estado_item e id_ubicacion son requeridos");
        }

        if (!Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0) {
            throw new Error("cantidad debe ser un entero mayor a cero");
        }

        return this.#withTransaction(async (client) => {
            const itemRes = await client.query(queries.crearItem.text, [
                nombre,
                descripcion,
                id_categoria,
                id_estado_item
            ]);
            const item = itemRes.rows[0];

            const invRes = await client.query(queries.crearInventario.text, [
                item.id_item,
                id_ubicacion,
                Number(cantidad)
            ]);
            const inventario = invRes.rows[0];

            const caracteristicasCreadas = [];
            if (Array.isArray(caracteristicas) && caracteristicas.length) {
                for (const c of caracteristicas) {
                    if (!c?.id_caracteristica) continue;
                    const result = await client.query(queries.crearCaracteristicaItem.text, [
                        item.id_item,
                        c.id_caracteristica,
                        c.valor ?? null
                    ]);
                    caracteristicasCreadas.push(result.rows[0]);
                }
            }

            return { item, inventario, caracteristicas: caracteristicasCreadas };
        });
    }

    /**
     * Actualiza un item y, opcionalmente, su inventario.
     * params[0] = {
     *   id_inventario,
     *   nombre?, descripcion?, id_categoria?, id_estado_item?,
     *   cantidad?, id_ubicacion?,
     *   caracteristicas?: [{ id_caracteristica, valor }]
     * }
     */
    async actualizar(params, _req) {
        const {
            id_inventario,
            nombre = null,
            descripcion = null,
            id_categoria = null,
            id_estado_item = null,
            cantidad = null,
            id_ubicacion = null,
            caracteristicas
        } = params[0] ?? {};

        if (!id_inventario) throw new Error("id_inventario requerido");

        return this.#withTransaction(async (client) => {
            const invActualRes = await client.query(
                "SELECT id_item FROM inventario WHERE id_inventario = $1 FOR UPDATE",
                [id_inventario]
            );
            if (!invActualRes.rows.length) {
                throw new Error(`Registro de inventario ${id_inventario} no encontrado`);
            }

            const id_item = invActualRes.rows[0].id_item;

            const itemRes = await client.query(queries.actualizarItem.text, [
                nombre,
                descripcion,
                id_categoria,
                id_estado_item,
                id_item
            ]);

            const invRes = await client.query(queries.actualizarInventario.text, [
                cantidad,
                id_ubicacion,
                id_inventario
            ]);

            let caracteristicasActualizadas;
            if (Array.isArray(caracteristicas)) {
                await client.query(queries.limpiarCaracteristicasItem.text, [id_item]);
                caracteristicasActualizadas = [];
                for (const c of caracteristicas) {
                    if (!c?.id_caracteristica) continue;
                    const result = await client.query(queries.crearCaracteristicaItem.text, [
                        id_item,
                        c.id_caracteristica,
                        c.valor ?? null
                    ]);
                    caracteristicasActualizadas.push(result.rows[0]);
                }
            }

            return {
                item: itemRes.rows[0],
                inventario: invRes.rows[0],
                caracteristicas: caracteristicasActualizadas ?? null
            };
        });
    }

    /**
     * Elimina un item y todos sus registros de inventario, solo si no existen
     * movimientos históricos asociados a sus inventarios.
     * params[0] = { id_item }
     */
    async eliminar(params, _req) {
        const { id_item } = params[0] ?? {};
        if (!id_item) throw new Error("id_item requerido");

        return this.#withTransaction(async (client) => {
            const refs = await client.query(queries.referenciasItem.text, [id_item]);
            if (Number(refs.rows[0]?.total ?? 0) > 0) {
                throw new Error("No se puede eliminar el item porque tiene movimientos históricos asociados");
            }

            await client.query(queries.limpiarCaracteristicasItem.text, [id_item]);
            const invRes = await client.query(queries.eliminarInventariosItem.text, [id_item]);
            const itemRes = await client.query(queries.eliminarItem.text, [id_item]);

            if (!itemRes.rowCount) {
                throw new Error(`Item ${id_item} no encontrado`);
            }

            return {
                eliminado: true,
                id_item,
                inventarios_eliminados: invRes.rowCount
            };
        });
    }
}
