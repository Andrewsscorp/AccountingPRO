import express from 'express';
import { PrismaClient as PrismaTenant } from '@prisma/client-tenant';
import { PrismaClient as PrismaGlobal } from '@prisma/client-global';

const router = express.Router();
const prismaGlobal = new PrismaGlobal();


// GET /:tenantId/tipos-documento
router.get('/:tenantId/tipos-documento', async (req, res) => {
  const { tenantId } = req.params;
  let pTenant;
  try {
    pTenant = req.tenantPrisma;
    const tipos = await pTenant.tipoDocumento.findMany({
      include: {
        numeraciones: true,
        permisos: true
      },
      orderBy: { codigo: 'asc' }
    });
    res.json({ success: true, data: tipos });
  } catch (error) {
    console.error('Error fetching tipos-documento:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// POST /:tenantId/tipos-documento
router.post('/:tenantId/tipos-documento', async (req, res) => {
  const { tenantId } = req.params;
  const data = req.body;
  const { numeraciones, permisos, ...tipoData } = data;
  let pTenant;
  try {
    pTenant = req.tenantPrisma;
    
    // Check duplicity
    const exists = await pTenant.tipoDocumento.findUnique({ where: { codigo: tipoData.codigo } });
    if (exists) {
      return res.status(400).json({ success: false, message: 'El código del documento ya existe.' });
    }

    const created = await pTenant.tipoDocumento.create({
      data: {
        ...tipoData,
        esSistema: false,
        numeraciones: {
          create: numeraciones || []
        },
        permisos: {
          create: permisos || []
        }
      },
      include: { numeraciones: true, permisos: true }
    });

    if (permisos && permisos.length > 0) {
      const audiciones = permisos.map((p: any) => ({
        tipoDocumentoId: created.id,
        usuarioId: 'admin',
        rolId: p.rolId,
        accion: 'CREAR_PERMISOS',
        detalle: `Permisos iniciales: crear=${p.crear}, editar=${p.editar}, anular=${p.anular}, imprimir=${p.imprimir}`
      }));
      await pTenant.auditoriaPermisoDocumento.createMany({ data: audiciones });
    }

    await pTenant.auditoriaTipoDocumento.create({
      data: {
        tipoDocumentoId: created.id,
        usuarioId: 'admin',
        campo: 'TODO',
        valorAnterior: null,
        valorNuevo: 'CREACION'
      }
    });

    res.json({ success: true, data: created });
  } catch (error) {
    console.error('Error creating tipo-documento:', error);
    res.status(500).json({ success: false, message: 'Error creando tipo de documento' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// PUT /:tenantId/tipos-documento/:id
router.put('/:tenantId/tipos-documento/:id', async (req, res) => {
  const { tenantId, id } = req.params;
  const { numeraciones, permisos, ...tipoData } = req.body;
  let pTenant;
  try {
    pTenant = req.tenantPrisma;
    
    const existing = await pTenant.tipoDocumento.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'No encontrado' });

    const currentNum = await pTenant.numeracion.findFirst({ where: { tipoDocumentoId: Number(id) } });
    const hasMovements = currentNum && currentNum.consecutivoActual > 0;

    if (hasMovements) {
      if (tipoData.codigo && tipoData.codigo !== existing.codigo) {
        return res.status(400).json({ success: false, message: 'El documento ya posee movimientos registrados. Los campos estructurales no pueden modificarse.' });
      }
      if (tipoData.modulo && tipoData.modulo !== existing.modulo) {
        return res.status(400).json({ success: false, message: 'El documento ya posee movimientos registrados. Los campos estructurales no pueden modificarse.' });
      }
      if (tipoData.clase && tipoData.clase !== existing.clase) {
        return res.status(400).json({ success: false, message: 'El documento ya posee movimientos registrados. Los campos estructurales no pueden modificarse.' });
      }
      if (tipoData.activo === false && existing.activo === true) {
        return res.status(400).json({ success: false, message: 'Existen documentos pendientes asociados. No es posible inactivar.' });
      }
    }

    // Check code duplicity
    if (tipoData.codigo && tipoData.codigo !== existing.codigo) {
      const codeExists = await pTenant.tipoDocumento.findUnique({ where: { codigo: tipoData.codigo } });
      if (codeExists) return res.status(400).json({ success: false, message: 'El código ya existe en otro documento.' });
    }

    // Prepare Audit Logs
    const auditLogs: any[] = [];
    const pushLog = (campo: string, oldV: any, newV: any) => {
      if (oldV !== undefined && newV !== undefined && String(oldV) !== String(newV)) {
        auditLogs.push({ tipoDocumentoId: existing.id, usuarioId: 'admin', campo, valorAnterior: String(oldV), valorNuevo: String(newV) });
      }
    };
    
    pushLog('codigo', existing.codigo, tipoData.codigo);
    pushLog('nombre', existing.nombre, tipoData.nombre);
    pushLog('descripcion', existing.descripcion, tipoData.descripcion);
    pushLog('modulo', existing.modulo, tipoData.modulo);
    pushLog('clase', existing.clase, tipoData.clase);
    pushLog('requiereTercero', existing.requiereTercero, tipoData.requiereTercero);
    pushLog('requiereCentroCosto', existing.requiereCentroCosto, tipoData.requiereCentroCosto);
    pushLog('permiteAnexos', existing.permiteAnexos, tipoData.permiteAnexos);
    pushLog('permiteObservaciones', existing.permiteObservaciones, tipoData.permiteObservaciones);
    pushLog('activo', existing.activo, tipoData.activo);

    // Update process
    const updated = await pTenant.$transaction(async (tx) => {
        if (numeraciones && numeraciones.length > 0) {
          const numData = numeraciones[0];
          if (hasMovements) {
            if ((numData.prefijo || "") !== (currentNum.prefijo || "")) {
              throw new Error('No es posible modificar el prefijo porque existen documentos asociados.');
            }
            if (numData.longitud < currentNum.longitud) {
              throw new Error('No puede reducir la longitud porque existen documentos emitidos.');
            }
          }
        
        pushLog('longitudConsecutivo', currentNum?.longitud, numData.longitud);
        pushLog('reinicioAnual', currentNum?.reinicioAnual, numData.reinicioAnual);
        pushLog('reinicioMensual', currentNum?.reinicioMensual, numData.reinicioMensual);
        pushLog('permiteManual', currentNum?.permiteManual, numData.permiteManual);

        await tx.numeracion.deleteMany({ where: { tipoDocumentoId: Number(id) } });
        await tx.numeracion.createMany({ 
          data: numeraciones.map((n: any) => ({ 
            ...n, 
            tipoDocumentoId: Number(id),
            consecutivoActual: hasMovements ? currentNum.consecutivoActual : (n.consecutivoActual !== undefined ? n.consecutivoActual : (n.rangoInicial || 1))
          })) 
        });
      }
      
      if (permisos && permisos.length > 0) {
        await tx.tipoDocumentoPermiso.deleteMany({ where: { tipoDocumentoId: Number(id) } });
        await tx.tipoDocumentoPermiso.createMany({ data: permisos.map((p: any) => ({ ...p, tipoDocumentoId: Number(id) })) });
        
        const audiciones = permisos.map((p: any) => ({
          tipoDocumentoId: Number(id),
          usuarioId: 'admin',
          rolId: p.rolId,
          accion: 'ACTUALIZAR_PERMISOS',
          detalle: `Permisos asignados: crear=${p.crear}, editar=${p.editar}, anular=${p.anular}, imprimir=${p.imprimir}`
        }));
        await tx.auditoriaPermisoDocumento.createMany({ data: audiciones });
      }

      if (auditLogs.length > 0) {
        await tx.auditoriaTipoDocumento.createMany({ data: auditLogs });
      }

      return tx.tipoDocumento.update({
        where: { id: Number(id) },
        data: tipoData,
        include: { numeraciones: true, permisos: true }
      });
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating tipo-documento:', error);
    const message = error.message.includes('No es posible') ? error.message : 'Error actualizando';
    res.status(400).json({ success: false, message });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// GET /:tenantId/tipos-documento/:id/validaciones
router.get('/:tenantId/tipos-documento/:id/validaciones', async (req, res) => {
  const { tenantId, id } = req.params;
  let pTenant;
  try {
    pTenant = req.tenantPrisma;
    const existing = await pTenant.tipoDocumento.findUnique({
      where: { id: Number(id) },
      include: {
        comprobantes: true,
        numeraciones: true,
        permisos: true
      }
    });

    if (!existing) return res.status(404).json({ success: false, message: 'No encontrado' });

    const comprobantesGenerados = existing.comprobantes.length;
    const numeracionUtilizada = existing.numeraciones.some((n: any) => n.consecutivoActual > 0);
    const usuariosAsociados = existing.permisos.length;
    const estadoActual = existing.activo ? 'Activo' : 'Inactivo';

    res.json({
      success: true,
      data: {
        comprobantesGenerados,
        numeracionUtilizada,
        usuariosAsociados,
        estadoActual
      }
    });
  } catch (error) {
    console.error('Error fetching validations:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo validaciones' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// DELETE /:tenantId/tipos-documento/:id
router.delete('/:tenantId/tipos-documento/:id', async (req, res) => {
  const { tenantId, id } = req.params;
  // Puede venir en body o query
  const action = req.body.action || req.query.action || 'delete'; 

  const SYSTEM_DOCS = ['CC', 'CE', 'RC', 'FV', 'FC', 'NC', 'ND', 'CA', 'PR'];

  let pTenant;
  try {
    pTenant = req.tenantPrisma;
    const existing = await pTenant.tipoDocumento.findUnique({
      where: { id: Number(id) },
      include: {
        comprobantes: true,
        numeraciones: true
      }
    });
    
    if (!existing) return res.status(404).json({ success: false, message: 'No encontrado' });

    const comprobantesGenerados = existing.comprobantes.length;
    const numeracionUtilizada = existing.numeraciones.some((n: any) => n.consecutivoActual > 0);
    const esSistema = SYSTEM_DOCS.includes(existing.codigo);

    if (action === 'delete') {
      if (esSistema) {
        return res.status(400).json({ success: false, message: 'Este tipo documental es del sistema y no puede eliminarse.' });
      }
      if (comprobantesGenerados > 0 || numeracionUtilizada) {
        return res.status(400).json({ success: false, message: 'Este tipo documental posee movimientos o numeración utilizada y no puede eliminarse físicamente.' });
      }

      await pTenant.$transaction(async (tx: any) => {
        await tx.tipoDocumento.delete({ where: { id: Number(id) } });

        await tx.auditoriaTipoDocumento.create({
          data: {
            tipoDocumentoId: existing.id, // Keep old ID for reference
            usuarioId: 'admin',
            campo: 'ACCIÓN',
            valorAnterior: existing.codigo,
            valorNuevo: 'ELIMINAR DEFINITIVAMENTE'
          }
        });
      });

      return res.json({ success: true, action: 'deleted', message: 'Tipo documental eliminado correctamente.' });
    } else if (action === 'deactivate') {
      await pTenant.$transaction(async (tx: any) => {
        await tx.tipoDocumento.update({
          where: { id: Number(id) },
          data: { activo: false }
        });

        await tx.auditoriaTipoDocumento.create({
          data: {
            tipoDocumentoId: existing.id,
            usuarioId: 'admin',
            campo: 'ACCIÓN',
            valorAnterior: existing.activo ? 'ACTIVO' : 'INACTIVO',
            valorNuevo: 'DESACTIVAR'
          }
        });
      });

      return res.json({ success: true, action: 'deactivated', message: 'Tipo documental desactivado correctamente.' });
    }

    res.status(400).json({ success: false, message: 'Acción inválida' });

  } catch (error) {
    console.error('Error deleting/deactivating tipo-documento:', error);
    res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

export default router;
