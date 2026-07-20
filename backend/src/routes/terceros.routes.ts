import express from 'express';
import { PrismaClient as PrismaTenant } from '@prisma/client-tenant';
import { PrismaClient as PrismaGlobal } from '@prisma/client-global';

const router = express.Router();
const prismaGlobal = new PrismaGlobal();


// Listar Terceros
router.get('/:tenantId/terceros', async (req, res) => {
  const { tenantId } = req.params;
  let pTenant;
  try {
    pTenant = req.tenantPrisma;
    const terceros = await pTenant.tercero.findMany({
      include: {
        roles: true
      },
      orderBy: [
        { esEmpresaPrincipal: 'desc' }, // Primero la principal
        { razonSocial: 'asc' },
        { apellido1: 'asc' }
      ]
    });

    res.json({ success: true, data: terceros });
  } catch (error) {
    console.error('Error fetching terceros:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo terceros' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// Crear Tercero
router.post('/:tenantId/terceros', async (req, res) => {
  const { tenantId } = req.params;
  const { roles, ...data } = req.body;
  
  let pTenant;
  try {
    pTenant = req.tenantPrisma;
    
    // Check duplicity
    const exists = await pTenant.tercero.findUnique({
      where: { identificacion: data.identificacion }
    });

    if (exists) {
      return res.status(400).json({ success: false, message: 'El documento ya está registrado (incluso si está inactivo).' });
    }

    const tercero = await pTenant.tercero.create({
      data: {
        ...data,
        esEmpresaPrincipal: false, // Never allowed from UI
        roles: {
          create: roles?.map((r: string) => ({ rol: r })) || []
        }
      },
      include: { roles: true }
    });

    res.json({ success: true, data: tercero });
  } catch (error) {
    console.error('Error creating tercero:', error);
    res.status(500).json({ success: false, message: 'Error creando tercero' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// Actualizar Tercero
router.put('/:tenantId/terceros/:id', async (req, res) => {
  const { tenantId, id } = req.params;
  const { roles, ...data } = req.body;
  let pTenant;
  try {
    pTenant = req.tenantPrisma;

    const exists = await pTenant.tercero.findUnique({ where: { id: Number(id) } });
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Tercero no encontrado.' });
    }

    // Reglas Críticas (Ningún tercero puede cambiar estos campos)
    if (data.tipoIdentificacion && data.tipoIdentificacion !== exists.tipoIdentificacion) {
      return res.status(400).json({ success: false, message: 'No se puede modificar el tipo de documento.' });
    }
    if (data.identificacion && data.identificacion !== exists.identificacion) {
      return res.status(400).json({ success: false, message: 'No se puede modificar el número de documento.' });
    }
    if (data.dv && data.dv !== exists.dv) {
      return res.status(400).json({ success: false, message: 'No se puede modificar el dígito de verificación directamente.' });
    }
    if (data.tipoPersona && data.tipoPersona !== exists.tipoPersona) {
      return res.status(400).json({ success: false, message: 'No es posible cambiar una persona natural a jurídica ni viceversa.' });
    }

    // Regla de Modificación (Principal)
    if (exists.esEmpresaPrincipal) {
      if (data.activa === false) {
        return res.status(400).json({ success: false, message: 'Este tercero corresponde a la empresa principal del sistema y no puede inactivarse.' });
      }
    }

    // Preparar Auditoría
    const auditoriaPayload: any[] = [];
    const checkChange = (campo: string, nuevoValor: any) => {
      const viejoValor = (exists as any)[campo];
      if (nuevoValor !== undefined && nuevoValor !== viejoValor) {
        auditoriaPayload.push({
          terceroId: Number(id),
          usuarioId: 'SISTEMA', // Reemplazar con el usuario de la sesión real
          campo,
          valorAnterior: String(viejoValor || ''),
          valorNuevo: String(nuevoValor || ''),
          ip: req.ip || '127.0.0.1'
        });
      }
    };

    const auditFields = [
      'nombre1', 'nombre2', 'apellido1', 'apellido2', 'razonSocial', 'nombreComercial',
      'actividadCiiu', 'regimenTributario', 'responsabilidadDian', 'granContribuyente', 'autorretenedor',
      'email', 'telefono', 'celular', 'direccion', 'ciudad', 'departamento', 'activa'
    ];

    auditFields.forEach(f => checkChange(f, data[f]));

    // Transaction
    const transactionOps = [];
    
    // Delete existing roles
    transactionOps.push(pTenant.terceroRol.deleteMany({ where: { terceroId: Number(id) } }));
    
    // Update tercero
    transactionOps.push(pTenant.tercero.update({
      where: { id: Number(id) },
      data: {
        ...data,
        esEmpresaPrincipal: exists.esEmpresaPrincipal, // Preserve
        tipoIdentificacion: exists.tipoIdentificacion,
        identificacion: exists.identificacion,
        dv: exists.dv,
        tipoPersona: exists.tipoPersona,
        roles: {
          create: roles?.map((r: string) => ({ rol: r })) || []
        }
      },
      include: { roles: true }
    }));

    // Insert audit
    if (auditoriaPayload.length > 0) {
      transactionOps.push(pTenant.auditoriaTercero.createMany({ data: auditoriaPayload }));
    }

    const results = await pTenant.$transaction(transactionOps);
    const terceroUpdated = results[1];

    res.json({ success: true, data: terceroUpdated });
  } catch (error) {
    console.error('Error updating tercero:', error);
    res.status(500).json({ success: false, message: 'Error actualizando tercero' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// Validar Dependencias de un Tercero
router.get('/:tenantId/terceros/:id/dependencias', async (req, res) => {
  const { tenantId, id } = req.params;
  let pTenant;
  try {
    pTenant = req.tenantPrisma;
    
    const movCount = await pTenant.movimiento.count({ where: { terceroId: Number(id) } });
    const audCount = await pTenant.auditoriaTercero.count({ where: { terceroId: Number(id) } });
    
    res.json({
      success: true,
      data: {
        movimientos: movCount,
        auditoria: audCount,
        subcuentas: 0,
        facturas: 0,
        pagos: 0,
        documentosElectronicos: 0,
        otrosModulos: 0
      }
    });
  } catch (error) {
    console.error('Error fetching dependencias:', error);
    res.status(500).json({ success: false, message: 'Error validando dependencias' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// Eliminar Tercero
router.delete('/:tenantId/terceros/:id', async (req, res) => {
  const { tenantId, id } = req.params;
  let pTenant;
  try {
    pTenant = req.tenantPrisma;
    
    const exists = await pTenant.tercero.findUnique({ where: { id: Number(id) } });
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Tercero no encontrado.' });
    }

    if (exists.esEmpresaPrincipal) {
      return res.status(400).json({ success: false, message: 'Este tercero representa la empresa principal y no puede eliminarse.' });
    }

    // Validar Movimientos y Auditoria
    const movCount = await pTenant.movimiento.count({ where: { terceroId: Number(id) } });
    const audCount = await pTenant.auditoriaTercero.count({ where: { terceroId: Number(id) } });
    
    if (movCount > 0 || audCount > 0) {
      return res.status(400).json({ success: false, message: 'El tercero posee movimientos o documentos asociados y no puede eliminarse físicamente.' });
    }

    // Transaction to Audit deletion and Delete Tercero
    const docTercero = `${exists.tipoIdentificacion} ${exists.identificacion}`;
    const nomTercero = exists.tipoPersona === 'JURIDICA' ? exists.razonSocial : `${exists.nombre1} ${exists.apellido1}`;

    const transactionOps = [
      pTenant.auditoriaTercero.create({
        data: {
          terceroId: null, // Será null porque el tercero se va a borrar
          usuarioId: 'SISTEMA',
          accion: 'ELIMINAR',
          documentoTercero: docTercero,
          nombreTercero: nomTercero,
          ip: req.ip || '127.0.0.1'
        }
      }),
      pTenant.terceroRol.deleteMany({ where: { terceroId: Number(id) } }),
      pTenant.tercero.delete({ where: { id: Number(id) } })
    ];

    await pTenant.$transaction(transactionOps);
    
    res.json({ success: true, message: 'Tercero eliminado correctamente.' });
  } catch (error) {
    console.error('Error deleting tercero:', error);
    res.status(500).json({ success: false, message: 'Error eliminando tercero' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// Cambiar estado a Inactivo (o Activo)
router.patch('/:tenantId/terceros/:id/estado', async (req, res) => {
  const { tenantId, id } = req.params;
  const { activa } = req.body;
  let pTenant;
  try {
    pTenant = req.tenantPrisma;
    
    const exists = await pTenant.tercero.findUnique({ where: { id: Number(id) } });
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Tercero no encontrado.' });
    }

    if (exists.esEmpresaPrincipal && !activa) {
      return res.status(400).json({ success: false, message: 'La empresa principal no puede ser inactivada.' });
    }

    const updated = await pTenant.tercero.update({
      where: { id: Number(id) },
      data: { activa }
    });

    res.json({ success: true, message: `Tercero marcado como ${activa ? 'Activo' : 'Inactivo'}.`, data: updated });
  } catch (error) {
    console.error('Error updating estado:', error);
    res.status(500).json({ success: false, message: 'Error cambiando estado del tercero' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

export default router;
