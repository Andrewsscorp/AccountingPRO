import express from 'express';
import { PrismaClient as PrismaTenant } from '@prisma/client-tenant';
import { PrismaClient as PrismaGlobal } from '@prisma/client-global';

const router = express.Router();
const prismaGlobal = new PrismaGlobal();


// Helpers
function buildTree(items: any[], id: number | null = null): any[] {
  return items
    .filter(item => item.padreId === id)
    .map(item => ({ ...item, hijos: buildTree(items, item.id) }));
}

// GET /estructura - Obtener configuración
router.get('/:tenantId/centros-costo/estructura', async (req: any, res: any) => {
  let pTenant: any;
  try {
    pTenant = req.tenantPrisma;
    let config = await pTenant.configuracionCentrosCosto.findFirst();
    if (!config) {
      config = {
        id: 0,
        nivel1Longitud: 2,
        nivel2Longitud: 2,
        nivel3Longitud: 2,
        nivel4Longitud: 2,
        nivel5Longitud: 2,
        estructuraBloqueada: false,
        fechaCreacion: new Date(),
        usuarioCreacion: null
      };
    }
    
    const movCount = await pTenant.movimientoCentroCosto.count();
    const hasMovimientos = movCount > 0;
    res.json({ success: true, data: { ...config, hasMovimientos } });
  } catch (error: any) {
    console.error('Error fetching estructura CC:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// POST /estructura - Guardar configuración
router.post('/:tenantId/centros-costo/estructura', async (req: any, res: any) => {
  const { n1, n2, n3, n4, n5 } = req.body;
  const v1 = Number(n1) || 0;
  const v2 = Number(n2) || 0;
  const v3 = Number(n3) || 0;
  const v4 = Number(n4) || 0;
  const v5 = Number(n5) || 0;

  if (v1 > 4 || v2 > 4 || v3 > 4 || v4 > 4 || v5 > 4) {
    return res.status(400).json({ success: false, message: 'Máximo 4 dígitos por nivel' });
  }
  if (v1 === 0) {
    return res.status(400).json({ success: false, message: 'El nivel 1 debe tener al menos 1 dígito' });
  }

  let pTenant: any;
  try {
    pTenant = req.tenantPrisma;
    const movCount = await pTenant.movimientoCentroCosto.count();
    if (movCount > 0) {
      return res.status(400).json({ success: false, message: 'La estructura no puede modificarse porque existen movimientos asociados a centros de costos.' });
    }

    const ccCount = await pTenant.centroCosto.count();
    if (ccCount > 0) {
      await pTenant.auditoriaCentroCosto.deleteMany();
      await pTenant.centroCosto.deleteMany();
    }

    let config = await pTenant.configuracionCentrosCosto.findFirst();
    if (config) {
      config = await pTenant.configuracionCentrosCosto.update({
        where: { id: config.id },
        data: { nivel1Longitud: v1, nivel2Longitud: v2, nivel3Longitud: v3, nivel4Longitud: v4, nivel5Longitud: v5 }
      });
    } else {
      config = await pTenant.configuracionCentrosCosto.create({
        data: { nivel1Longitud: v1, nivel2Longitud: v2, nivel3Longitud: v3, nivel4Longitud: v4, nivel5Longitud: v5 }
      });
    }
    res.json({ success: true, data: config });
  } catch (error: any) {
    console.error('Error saving estructura CC:', error);
    res.status(500).json({ success: false, message: 'Error del servidor al guardar estructura' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// GET /arbol - Jerarquía
router.get('/:tenantId/centros-costo/arbol', async (req: any, res: any) => {
  let pTenant: any;
  try {
    pTenant = req.tenantPrisma;
    const centros = await pTenant.centroCosto.findMany({
      orderBy: { codigo: 'asc' }
    });
    
    const arbol = buildTree(centros);
    res.json({ success: true, data: arbol });
  } catch (error: any) {
    console.error('Error fetching centros de costo arbol:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// GET / - Listado plano
router.get('/:tenantId/centros-costo', async (req: any, res: any) => {
  let pTenant: any;
  try {
    pTenant = req.tenantPrisma;
    const centros = await pTenant.centroCosto.findMany({
      include: {
        padre: { select: { codigo: true, nombre: true } },
        _count: { select: { movimientos: true, hijos: true } }
      },
      orderBy: { codigo: 'asc' }
    });
    res.json({ success: true, data: centros });
  } catch (error: any) {
    console.error('Error fetching centros de costo:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// GET /:id/validaciones
router.get('/:tenantId/centros-costo/:id/validaciones', async (req: any, res: any) => {
  let pTenant: any;
  try {
    const { id } = req.params;
    pTenant = req.tenantPrisma;

    const centro = await pTenant.centroCosto.findUnique({
      where: { id: Number(id) },
      include: {
        _count: { select: { movimientos: true, hijos: true, presupuestos: true } }
      }
    });

    if (!centro) return res.status(404).json({ success: false, message: 'Centro de costo no encontrado' });

    res.json({
      success: true,
      data: {
        estadoActual: centro.activo ? 'Activo' : 'Inactivo',
        movimientos: centro._count.movimientos,
        hijos: centro._count.hijos,
        presupuestos: centro._count.presupuestos
      }
    });
  } catch (error: any) {
    console.error('Error validando centro de costo:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// POST /
router.post('/:tenantId/centros-costo', async (req: any, res: any) => {
  let pTenant: any;
  try {
    const { codigo, nombre, padreId, descripcion, activo } = req.body;
    pTenant = req.tenantPrisma;

    if (!codigo || !nombre) {
      return res.status(400).json({ success: false, message: 'Código y nombre son obligatorios.' });
    }

    const codeExists = await pTenant.centroCosto.findUnique({ where: { codigo } });
    if (codeExists) {
      return res.status(400).json({ success: false, message: 'El código de centro de costo ya existe.' });
    }

    let nivel = 1;
    let ruta = codigo;
    if (padreId) {
      const padre = await pTenant.centroCosto.findUnique({ where: { id: Number(padreId) } });
      if (!padre) {
        return res.status(400).json({ success: false, message: 'Centro padre no encontrado.' });
      }
      nivel = padre.nivel + 1;
      if (nivel > 10) {
        return res.status(400).json({ success: false, message: 'La jerarquía no puede superar los 10 niveles.' });
      }
      ruta = `${padre.ruta}.${codigo}`;
    }

    const result = await pTenant.$transaction(async (tx: any) => {
      const nuevoCentro = await tx.centroCosto.create({
        data: {
          codigo,
          nombre,
          padreId: padreId ? Number(padreId) : null,
          nivel,
          ruta,
          descripcion,
          activo: activo !== false,
          createdBy: 'admin'
        }
      });

      await tx.auditoriaCentroCosto.create({
        data: {
          centroCostoId: nuevoCentro.id,
          usuarioId: 'admin',
          accion: 'CREAR',
          campo: 'N/A',
          valorNuevo: `Código: ${codigo}, Nombre: ${nombre}`
        }
      });

      return nuevoCentro;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error creating centro costo:', error);
    res.status(500).json({ success: false, message: 'Error del servidor al crear' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// PUT /:id
router.put('/:tenantId/centros-costo/:id', async (req: any, res: any) => {
  let pTenant: any;
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;
    pTenant = req.tenantPrisma;

    const existing = await pTenant.centroCosto.findUnique({ 
      where: { id: Number(id) },
      include: {
        _count: { select: { movimientos: true, hijos: true } }
      }
    });

    if (!existing) return res.status(404).json({ success: false, message: 'No encontrado' });

    // Prevent deactivation if it has dependencies
    if (activo === false && existing.activo === true) {
      if (existing._count.movimientos > 0 || existing._count.hijos > 0) {
        return res.status(400).json({ success: false, message: 'No es posible inactivar porque posee movimientos o centros hijos.' });
      }
    }

    const auditLogs: any[] = [];
    const pushLog = (campo: string, oldV: any, newV: any) => {
      if (String(oldV) !== String(newV)) {
        auditLogs.push({ centroCostoId: existing.id, usuarioId: 'admin', accion: 'MODIFICAR', campo, valorAnterior: String(oldV), valorNuevo: String(newV) });
      }
    };

    pushLog('nombre', existing.nombre, nombre);
    pushLog('descripcion', existing.descripcion || '', descripcion || '');
    pushLog('activo', existing.activo, activo);

    const updated = await pTenant.$transaction(async (tx: any) => {
      const upd = await tx.centroCosto.update({
        where: { id: Number(id) },
        data: { nombre, descripcion, activo, updatedBy: 'admin' }
      });

      if (auditLogs.length > 0) {
        await tx.auditoriaCentroCosto.createMany({ data: auditLogs });
      }
      return upd;
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating centro costo:', error);
    res.status(500).json({ success: false, message: 'Error del servidor al actualizar' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// DELETE /:id
router.delete('/:tenantId/centros-costo/:id', async (req: any, res: any) => {
  let pTenant: any;
  try {
    const { id } = req.params;
    const action = req.body.action || 'delete';
    pTenant = req.tenantPrisma;

    const existing = await pTenant.centroCosto.findUnique({ 
      where: { id: Number(id) },
      include: { _count: { select: { movimientos: true, hijos: true } } }
    });
    if (!existing) return res.status(404).json({ success: false, message: 'No encontrado' });

    if (action === 'delete') {
      if (existing._count.movimientos > 0 || existing._count.hijos > 0) {
        return res.status(400).json({ success: false, message: 'Este centro posee movimientos o hijos y no puede eliminarse físicamente.' });
      }

      await pTenant.$transaction(async (tx: any) => {
        await tx.centroCosto.delete({ where: { id: Number(id) } });
        await tx.auditoriaCentroCosto.create({
          data: {
            centroCostoId: existing.id,
            usuarioId: 'admin',
            accion: 'ELIMINAR DEFINITIVAMENTE',
            valorAnterior: existing.codigo
          }
        });
      });
      return res.json({ success: true, message: 'Eliminado correctamente' });

    } else if (action === 'deactivate') {
      if (existing._count.hijos > 0) {
        return res.status(400).json({ success: false, message: 'No puede desactivar un centro que posee centros hijos. Desactive los hijos primero.' });
      }
      await pTenant.$transaction(async (tx: any) => {
        await tx.centroCosto.update({ where: { id: Number(id) }, data: { activo: false, updatedBy: 'admin' } });
        await tx.auditoriaCentroCosto.create({
          data: {
            centroCostoId: existing.id,
            usuarioId: 'admin',
            accion: 'DESACTIVAR',
            valorAnterior: existing.codigo
          }
        });
      });
      return res.json({ success: true, message: 'Desactivado correctamente' });
    }

    res.status(400).json({ success: false, message: 'Acción inválida' });
  } catch (error: any) {
    console.error('Error deleting centro costo:', error);
    res.status(500).json({ success: false, message: 'Error del servidor al procesar la acción' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

export default router;
