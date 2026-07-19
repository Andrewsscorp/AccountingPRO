import { Router } from 'express';
import { PrismaClient as PrismaTenant } from '@prisma/client-tenant';
import { PrismaClient as PrismaGlobal } from '@prisma/client-global';

const router = Router();
const prismaGlobal = new PrismaGlobal();

// Endpoint de prueba para verificar que el mÃ³dulo contabilidad responde
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'MÃ³dulo de Contabilidad Operativo' });
});

// Helper to get tenant prisma client
const getTenantPrisma = async (codigoEmpresa: string) => {
  const empresa = await prismaGlobal.empresaGlobal.findFirst({
    where: { codigo_empresa: codigoEmpresa }
  });

  if (!empresa) {
    throw new Error('Empresa no encontrada');
  }

  return new PrismaTenant({
    datasources: {
      db: {
        url: `file:./${empresa.nombre_bd}.db`
      }
    }
  });
};

// Obtener Plan de Cuentas (Lista Completa)
router.get('/:tenantId/plan-cuentas', async (req, res) => {
  const { tenantId } = req.params;
  let pTenant;
  try {
    pTenant = await getTenantPrisma(tenantId);
    const cuentas = await pTenant.planCuenta.findMany({
      orderBy: { codigo: 'asc' }
    });
    res.json({ success: true, data: cuentas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error obteniendo plan de cuentas' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// Crear una Cuenta
router.post('/:tenantId/plan-cuentas', async (req, res) => {
  const { tenantId } = req.params;
  const { codigo, nombre, cuentaPadreId, movimiento, nivel } = req.body;
  let pTenant;
  try {
    pTenant = await getTenantPrisma(tenantId);
    
    // Obtener la cuenta padre
    const padre = await pTenant.planCuenta.findUnique({
      where: { codigo: cuentaPadreId }
    });

    if (!padre) {
      return res.status(400).json({ success: false, message: 'La cuenta padre no existe.' });
    }

    if (padre.movimiento) {
      return res.status(400).json({ success: false, message: 'No se pueden crear subcuentas debajo de una cuenta de movimiento.' });
    }

    // Heredar propiedades del padre
    const nuevaCuenta = await pTenant.planCuenta.create({
      data: {
        codigo,
        nombre,
        tipo: padre.tipo,
        naturaleza: padre.naturaleza,
        nivel,
        cuentaPadreId,
        requiereTercero: padre.requiereTercero,
        requiereCentroCosto: padre.requiereCentroCosto,
        movimiento,
        activa: true
      }
    });

    // Auditoria (opcional, placeholder)
    await pTenant.auditoriaContable.create({
      data: {
        usuario: 'admin', // Placeholder
        accion: 'CREAR_CUENTA',
        resultado: 'EXITO',
        detalles: `Cuenta creada: ${codigo} - Padre: ${cuentaPadreId}`
      }
    });

    res.json({ success: true, data: nuevaCuenta });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'El cÃ³digo de la cuenta ya existe.' });
    }
    res.status(500).json({ success: false, message: 'Error creando la cuenta' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// Actualizar una Cuenta
router.put('/:tenantId/plan-cuentas/:id', async (req, res) => {
  const { tenantId, id } = req.params;
  const { nombre, movimiento, requiereTercero, requiereCentroCosto, activa } = req.body;
  let pTenant;
  try {
    pTenant = await getTenantPrisma(tenantId);
    
    const cuentaOriginal = await pTenant.planCuenta.findUnique({
      where: { id: Number(id) }
    });

    if (!cuentaOriginal) {
      return res.status(404).json({ success: false, message: 'Cuenta no encontrada.' });
    }

    const movs = await pTenant.movimiento.count({
      where: { cuentaId: cuentaOriginal.id }
    });

    const hijas = await pTenant.planCuenta.count({
      where: { cuentaPadreId: cuentaOriginal.codigo }
    });

    // Validar Movimientos
    if (movs > 0) {
      if (movimiento !== cuentaOriginal.movimiento) {
        return res.status(400).json({ success: false, message: 'La cuenta posee movimientos contables y no puede cambiar su comportamiento de movimiento.' });
      }
      if (requiereTercero !== cuentaOriginal.requiereTercero) {
        return res.status(400).json({ success: false, message: 'La cuenta posee movimientos histÃ³ricos y no puede modificar la obligatoriedad de tercero.' });
      }
      if (requiereCentroCosto !== cuentaOriginal.requiereCentroCosto) {
        return res.status(400).json({ success: false, message: 'La cuenta posee movimientos histÃ³ricos y no puede modificar la obligatoriedad de centro de costo.' });
      }
    }

    // Validar subcuentas
    if (hijas > 0 && movimiento === true) {
      return res.status(400).json({ success: false, message: 'La cuenta posee subcuentas asociadas, no puede marcarse como cuenta de movimiento.' });
    }

    const cuentaEditada = await pTenant.planCuenta.update({
      where: { id: Number(id) },
      data: {
        nombre,
        movimiento,
        requiereTercero,
        requiereCentroCosto,
        activa
      }
    });

    // Registrar AuditoriaCuenta
    await pTenant.auditoriaCuenta.create({
      data: {
        cuentaId: cuentaOriginal.codigo,
        usuarioId: 'admin', // Placeholder
        accion: 'MODIFICAR_CUENTA',
        valorAnterior: JSON.stringify({
          nombre: cuentaOriginal.nombre,
          movimiento: cuentaOriginal.movimiento,
          requiereTercero: cuentaOriginal.requiereTercero,
          requiereCentroCosto: cuentaOriginal.requiereCentroCosto,
          activa: cuentaOriginal.activa
        }),
        valorNuevo: JSON.stringify({
          nombre,
          movimiento,
          requiereTercero,
          requiereCentroCosto,
          activa
        })
      }
    });

    res.json({ success: true, data: cuentaEditada });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error actualizando la cuenta' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// Obtener Dependencias de una cuenta
router.get('/:tenantId/plan-cuentas/:id/dependencias', async (req, res) => {
  const { tenantId, id } = req.params;
  let pTenant;
  try {
    pTenant = await getTenantPrisma(tenantId);
    
    const cuenta = await pTenant.planCuenta.findUnique({
      where: { id: Number(id) }
    });

    if (!cuenta) {
      return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
    }

    const movs = await pTenant.movimiento.count({
      where: { cuentaId: cuenta.id }
    });

    const hijas = await pTenant.planCuenta.count({
      where: { cuentaPadreId: cuenta.codigo }
    });

    res.json({ success: true, data: { movimientos: movs, hijas } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error obteniendo dependencias' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// Validar eliminaciÃ³n
router.get('/:tenantId/plan-cuentas/:id/validar-eliminacion', async (req, res) => {
  const { tenantId, id } = req.params;
  let pTenant;
  try {
    pTenant = await getTenantPrisma(tenantId);
    const cuenta = await pTenant.planCuenta.findUnique({ where: { id: Number(id) } });
    if (!cuenta) return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });

    const reasons: string[] = [];

    // Validacion 1: Hijas
    const hijas = await pTenant.planCuenta.count({ where: { cuentaPadreId: cuenta.codigo } });
    if (hijas > 0) reasons.push('La cuenta tiene subcuentas asociadas.');

    // Validacion 2: Movimientos
    const movimientos = await pTenant.movimiento.count({ where: { cuentaId: cuenta.id } });
    if (movimientos > 0) reasons.push('La cuenta tiene movimientos contables registrados.');

    // Validacion 5/6: Sistema
    if (cuenta.esSistema) reasons.push('Las cuentas estructurales del plan base no pueden eliminarse (Cuenta de Sistema).');

    // Validacion 7: Inactiva
    if (!cuenta.activa) reasons.push('No se puede eliminar una cuenta inactiva.');

    res.json({
      success: true,
      data: {
        canDelete: reasons.length === 0,
        reasons
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error validando eliminaciÃ³n' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// Eliminar una Cuenta
router.delete('/:tenantId/plan-cuentas/:id', async (req, res) => {
  const { tenantId, id } = req.params;
  let pTenant;
  try {
    pTenant = await getTenantPrisma(tenantId);
    const cuenta = await pTenant.planCuenta.findUnique({ where: { id: Number(id) } });
    if (!cuenta) return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });

    // Validar de nuevo
    const hijas = await pTenant.planCuenta.count({ where: { cuentaPadreId: cuenta.codigo } });
    const movimientos = await pTenant.movimiento.count({ where: { cuentaId: cuenta.id } });

    if (hijas > 0 || movimientos > 0 || cuenta.esSistema || !cuenta.activa) {
       return res.status(400).json({ success: false, message: 'La cuenta no cumple los requisitos para ser eliminada permanentemente.' });
    }

    // Auditoria
    await pTenant.auditoriaCuenta.create({
      data: {
        cuentaId: cuenta.codigo,
        usuarioId: 'admin',
        accion: 'ELIMINAR_CUENTA',
        valorAnterior: `${cuenta.codigo} - ${cuenta.nombre}`
      }
    });

    await pTenant.planCuenta.delete({
      where: { id: Number(id) }
    });
    
    res.json({ success: true, message: 'Cuenta eliminada correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error eliminando la cuenta' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// Obtener Comprobantes (Placeholder)
router.get('/:tenantId/comprobantes', async (req, res) => {
  const { tenantId } = req.params;
  try {
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error obteniendo comprobantes' });
  }
});

router.put('/:tenantId/plan-cuentas/:codigo/toggle-flag', async (req, res) => {
  const { tenantId, codigo } = req.params;
  const { field, value } = req.body;

  if (field !== 'requiereTercero' && field !== 'requiereCentroCosto') {
    return res.status(400).json({ success: false, message: 'Campo invÃ¡lido' });
  }

  let pTenant;
  try {
    pTenant = await getTenantPrisma(tenantId);
    
    // Actualiza en cascada: la cuenta actual y todas las subcuentas/auxiliares que empiecen por este cÃ³digo
    await pTenant.planCuenta.updateMany({
      where: {
        codigo: {
          startsWith: codigo
        }
      },
      data: {
        [field]: value
      }
    });

    res.json({ success: true, message: 'Cuentas actualizadas correctamente' });
  } catch (error) {
    console.error('Error actualizando flags:', error);
    res.status(500).json({ success: false, message: 'Error actualizando banderas' });
  } finally {
    if (pTenant) {
      await pTenant.$disconnect();
    }
  }
});

// ==========================================
// RUTAS DE ESTRUCTURA DEL PLAN DE CUENTAS
// ==========================================

router.get('/:tenantId/estructura-puc', async (req, res) => {
  const { tenantId } = req.params;
  let pTenant;
  try {
    pTenant = await getTenantPrisma(tenantId);
    
    // Obtener la configuracion
    let config = await pTenant.configuracionPlanCuentas.findFirst();
    if (!config) {
      // Si no existe, devolver la por defecto
      config = {
        id: 0,
        catalogoId: 'PUC_COLOMBIA',
        nivel1Longitud: 1,
        nivel2Longitud: 2,
        nivel3Longitud: 4,
        nivel4Longitud: 6,
        nivel5Longitud: 8,
        estructuraBloqueada: false,
        fechaCreacion: new Date(),
        usuarioCreacion: null
      };
    }

    // Comprobar si hay movimientos
    const movCount = await pTenant.movimiento.count();
    const hasMovimientos = movCount > 0;

    res.json({ success: true, data: { ...config, hasMovimientos } });
  } catch (error) {
    console.error('Error obteniendo estructura:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo la estructura del plan de cuentas' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

router.post('/:tenantId/estructura-puc', async (req, res) => {
  const { tenantId } = req.params;
  const { n1, n2, n3, n4, n5 } = req.body;

  // Validacion de max 4 y min 0, n1 min 1
  const v1 = Number(n1) || 0;
  const v2 = Number(n2) || 0;
  const v3 = Number(n3) || 0;
  const v4 = Number(n4) || 0;
  const v5 = Number(n5) || 0;

  if (v1 > 4 || v2 > 4 || v3 > 4 || v4 > 4 || v5 > 4) {
    return res.status(400).json({ success: false, message: 'MÃ¡ximo 4 dÃ­gitos por nivel' });
  }
  if (v1 === 0) {
    return res.status(400).json({ success: false, message: 'El nivel 1 debe tener al menos 1 dÃ­gito' });
  }

  let pTenant;
  try {
    pTenant = await getTenantPrisma(tenantId);

    // Verificar si hay movimientos
    const movCount = await pTenant.movimiento.count();
    if (movCount > 0) {
      return res.status(400).json({ success: false, message: 'La estructura no puede modificarse porque existen movimientos contables' });
    }

    let config = await pTenant.configuracionPlanCuentas.findFirst();

    // Regla de negocio: Si ya existe un plan de cuentas y la estructura es diferente (o deciden sobreescribir),
    // borramos el plan de cuentas existente para que lo armen desde cero con la nueva estructura.
    const cuentasCount = await pTenant.planCuenta.count();
    if (cuentasCount > 0) {
      await pTenant.planCuenta.deleteMany();
    }

    if (config) {
      config = await pTenant.configuracionPlanCuentas.update({
        where: { id: config.id },
        data: {
          nivel1Longitud: n1,
          nivel2Longitud: n2,
          nivel3Longitud: n3,
          nivel4Longitud: n4,
          nivel5Longitud: n5
        }
      });
    } else {
      config = await pTenant.configuracionPlanCuentas.create({
        data: {
          nivel1Longitud: n1,
          nivel2Longitud: n2,
          nivel3Longitud: n3,
          nivel4Longitud: n4,
          nivel5Longitud: n5
        }
      });
    }

    // Tambien podriamos volver a sembrar el PUC si eligieron la estandar, 
    // pero la regla dice "Si no acepta y define otra estructura se borra y empieza a crearla".
    // Si la estructura es la estandar (1-2-4-6-8), se podria re-sembrar, 
    // pero lo haremos simple: la base de datos queda vacia si cambian la estructura manualmente.

    res.json({ success: true, message: 'Estructura guardada correctamente', data: config });
  } catch (error) {
    console.error('Error guardando estructura:', error);
    res.status(500).json({ success: false, message: 'Error guardando la estructura del plan de cuentas' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EXPORTACIÃ“N PDF DE MOVIMIENTOS (MOV-EXP-002)
// El PDF jamÃ¡s genera informaciÃ³n nueva. Usa el dataset enviado.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
router.post('/:tenantId/movimientos/export/pdf', async (req, res) => {
  let pTenant: any;
  try {
    const { tenantId } = req.params;
    const { configuracion, filtros, dataset } = req.body;

    pTenant = await getTenantPrisma(tenantId);

    // â”€â”€ Obtener datos de la empresa para encabezado â”€â”€
    const empresa = await pTenant.configuracionEmpresa.findFirst();

    // â”€â”€ Obtener dataset: si viene del frontend, usarlo directamente â”€â”€
    // Si no viene dataset, re-ejecutar la consulta con los filtros
    let movimientos = dataset || [];
    
    if (!dataset || dataset.length === 0) {
      // Rebuild the search query from filters (fallback)
      const where: any = {};
      
      if (filtros.tipoDocumentoId) {
        where.comprobante = { tipoDocumentoId: parseInt(filtros.tipoDocumentoId) };
      }
      if (filtros.numeroDocumento) {
        where.comprobante = { ...where.comprobante, numero: { contains: filtros.numeroDocumento } };
      }
      if (filtros.cuentaId) {
        where.cuentaId = parseInt(filtros.cuentaId);
      }
      if (filtros.terceroId) {
        where.terceroId = parseInt(filtros.terceroId);
      }
      if (filtros.centroCostoId) {
        where.centroCostoId = parseInt(filtros.centroCostoId);
      }
      if (filtros.fechaInicial || filtros.fechaFinal) {
        where.fecha = {};
        if (filtros.fechaInicial) where.fecha.gte = new Date(filtros.fechaInicial);
        if (filtros.fechaFinal) where.fecha.lte = new Date(filtros.fechaFinal);
      }

      const rawData = await pTenant.movimiento.findMany({
        where,
        include: {
          cuenta: true,
          tercero: true,
          centroCosto: true,
          comprobante: { include: { tipoDocumento: true } }
        },
        orderBy: { fecha: 'asc' },
        take: 5000
      });

      movimientos = rawData.map((m: any) => ({
        fecha: m.fecha,
        documento: m.comprobante ? `${m.comprobante.tipoDocumento?.codigo || ''}-${String(m.comprobante.numero).padStart(8, '0')}` : '',
        tipoDocumento: m.comprobante?.tipoDocumento?.codigo || '',
        cuenta: m.cuenta?.codigo || '',
        descripcionCuenta: m.cuenta?.nombre || '',
        concepto: m.concepto || '',
        tercero: m.tercero ? `${m.tercero.identificacion || ''} - ${m.tercero.nombreComercial || m.tercero.razonSocial || ''}` : '',
        centroCosto: m.centroCosto?.nombre || '',
        debito: Number(m.debito) || 0,
        credito: Number(m.credito) || 0,
        saldo: (Number(m.debito) || 0) - (Number(m.credito) || 0)
      }));
    }

    // â”€â”€ ConfiguraciÃ³n del PDF â”€â”€
    const PDFDocument = require('pdfkit');
    const cfg = configuracion || {};
    const isHorizontal = cfg.orientacion === 'Horizontal';
    
    // Color scheme - Navy blue professional
    const NAVY = '#1a365d';
    const NAVY_LIGHT = '#2d4a7a';
    const HEADER_BG = '#e8edf3';
    const ROW_ALT = '#f5f7fa';
    const BORDER_COLOR = '#c4cdd5';
    
    // Paper sizes in points (1pt = 1/72 inch)
    let pageWidth = 612;  // Letter
    let pageHeight = 792;
    if (cfg.paperSize?.widthMm) {
      pageWidth = (cfg.paperSize.widthMm / 25.4) * 72;
      pageHeight = (cfg.paperSize.heightMm / 25.4) * 72;
    }

    const doc = new PDFDocument({
      size: isHorizontal ? [pageHeight, pageWidth] : [pageWidth, pageHeight],
      margins: { top: 30, bottom: 60, left: 28, right: 28 },
      bufferPages: true,
      info: {
        Title: 'Consulta de Movimientos',
        Author: empresa?.razonSocial || 'AccountingPRO',
        Creator: 'AccountingPRO - Sistema Contable'
      }
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    const W = isHorizontal 
      ? pageHeight - doc.options.margins.left - doc.options.margins.right 
      : pageWidth - doc.options.margins.left - doc.options.margins.right;
    const PH = isHorizontal ? pageWidth : pageHeight;
    const ML = doc.options.margins.left;

    // â”€â”€ Column definitions â”€â”€
    const allCols = [
      { id: 'fecha', label: 'Fecha', baseW: 52, align: 'left' as const },
      { id: 'documento', label: 'Documento', baseW: 65, align: 'left' as const },
      { id: 'tipoDoc', label: 'Tipo Doc.', baseW: 38, align: 'center' as const },
      { id: 'cuenta', label: 'Cuenta', baseW: 50, align: 'left' as const },
      { id: 'descripcionCuenta', label: 'DescripciÃ³n Cuenta', baseW: 100, align: 'left' as const },
      { id: 'concepto', label: 'Concepto', baseW: 85, align: 'left' as const },
      { id: 'tercero', label: 'Tercero', baseW: 90, align: 'left' as const },
      { id: 'centroCosto', label: 'Centro de Costo', baseW: 68, align: 'left' as const },
      { id: 'debito', label: 'DÃ©bito', baseW: 72, align: 'right' as const },
      { id: 'credito', label: 'CrÃ©dito', baseW: 72, align: 'right' as const },
      { id: 'saldo', label: 'Saldo', baseW: 68, align: 'right' as const }
    ];

    const selectedIds = cfg.columnasIds || allCols.map((c: any) => c.id);
    const columns = allCols.filter((c: any) => selectedIds.includes(c.id));
    const totalBaseW = columns.reduce((s: number, c: any) => s + c.baseW, 0);
    const scale = W / totalBaseW;
    const cols = columns.map((c: any) => ({ ...c, w: Math.floor(c.baseW * scale) }));
    // Fix rounding: give remainder to widest column
    const remainder = W - cols.reduce((s: number, c: any) => s + c.w, 0);
    if (cols.length > 0) cols[cols.length > 4 ? 4 : 0].w += remainder;

    const fmt = (val: number) => new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
    const fmtDate = (d: any) => {
      if (!d) return '';
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
    };
    const now = new Date();
    const nowStr = `${fmtDate(now)} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')} ${now.getHours() >= 12 ? 'p. m.' : 'a. m.'}`;

    let currentPage = 0;

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // HEADER
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const drawHeader = () => {
      const y0 = doc.options.margins.top;

      // â”€â”€ Left: Logo + Company Name â”€â”€
      if (cfg.incluirLogo !== false && empresa?.logoUrl) {
        try {
          const logoData = empresa.logoUrl.replace(/^data:image\/\w+;base64,/, '');
          const logoBuffer = Buffer.from(logoData, 'base64');
          doc.image(logoBuffer, ML, y0, { width: 50, height: 50 });
        } catch {
          // Draw placeholder box
          doc.rect(ML, y0, 50, 50).lineWidth(0.5).stroke(BORDER_COLOR);
          doc.fontSize(6).fillColor('#999').text('LOGO', ML, y0 + 20, { width: 50, align: 'center' });
        }
      }

      const nameX = ML + 58;
      doc.fontSize(13).font('Helvetica-Bold').fillColor(NAVY)
         .text(empresa?.razonSocial || 'EMPRESA S.A.S.', nameX, y0 + 5);
      doc.fontSize(7).font('Helvetica').fillColor('#555')
         .text(empresa?.objetoSocial || 'Soluciones Contables y Administrativas', nameX, y0 + 22);

      // â”€â”€ Center: NIT, Address, Phone, Website â”€â”€
      const centerX = ML + W * 0.35;
      const centerW = W * 0.30;
      doc.fontSize(7).font('Helvetica').fillColor('#333');
      const nit = empresa?.nit ? `NIT: ${empresa.nit}-${empresa.dv || ''}` : '';
      const dir = empresa?.direccionPrincipal || '';
      const ciudad = empresa?.ciudad ? `${empresa.ciudad}${empresa.departamento ? ' - ' + empresa.departamento : ''}` : '';
      const tel = empresa?.telefono1 ? `Tel: ${empresa.telefono1}` : '';
      const web = empresa?.sitioWeb || '';
      
      let cy = y0 + 2;
      if (nit) { doc.text(nit, centerX, cy, { width: centerW, align: 'center' }); cy += 10; }
      if (dir) { doc.text(dir, centerX, cy, { width: centerW, align: 'center' }); cy += 10; }
      if (ciudad) { doc.text(ciudad, centerX, cy, { width: centerW, align: 'center' }); cy += 10; }
      if (tel) { doc.text(tel, centerX, cy, { width: centerW, align: 'center' }); cy += 10; }
      if (web) { doc.text(web, centerX, cy, { width: centerW, align: 'center' }); }

      // â”€â”€ Right: Report Title â”€â”€
      const rightX = ML + W * 0.65;
      const rightW = W * 0.35;
      doc.fontSize(14).font('Helvetica-Bold').fillColor(NAVY)
         .text('CONSULTA DE MOVIMIENTOS', rightX, y0, { width: rightW, align: 'right' });
      
      doc.fontSize(7).font('Helvetica').fillColor('#555');
      let ry = y0 + 20;
      doc.text(`PerÃ­odo: ${filtros.fechaInicial ? fmtDate(filtros.fechaInicial) : '---'} - ${filtros.fechaFinal ? fmtDate(filtros.fechaFinal) : '---'}`, rightX, ry, { width: rightW, align: 'right' });
      ry += 10;
      doc.text(`Generado por: Administrador`, rightX, ry, { width: rightW, align: 'right' });
      ry += 10;
      doc.text(`Fecha de generaciÃ³n: ${nowStr}`, rightX, ry, { width: rightW, align: 'right' });
      ry += 10;
      doc.text(`PÃ¡gina: ${currentPage + 1}`, rightX, ry, { width: rightW, align: 'right' });

      // Separator line
      doc.y = y0 + 65;
      doc.moveTo(ML, doc.y).lineTo(ML + W, doc.y).lineWidth(1.5).strokeColor(NAVY).stroke();
      doc.y += 4;
    };

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // TABLE HEADER
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const drawTableHeader = () => {
      const y = doc.y;
      // Dark navy header
      doc.rect(ML, y, W, 16).fill(NAVY);
      
      let x = ML;
      cols.forEach((col: any) => {
        doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#ffffff')
           .text(col.label, x + 3, y + 4, { width: col.w - 6, align: col.align });
        x += col.w;
      });
      
      doc.fillColor('#000000');
      doc.y = y + 17;
    };

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // DRAW DATA ROWS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    drawHeader();
    drawTableHeader();

    const ROW_H = 15;
    const pageBottom = PH - doc.options.margins.bottom - 30;

    // Draw top border of table body
    doc.moveTo(ML, doc.y - 1).lineTo(ML + W, doc.y - 1).lineWidth(0.3).strokeColor(BORDER_COLOR).stroke();

    for (let i = 0; i < movimientos.length; i++) {
      if (doc.y + ROW_H > pageBottom) {
        // Draw bottom border before page break
        doc.moveTo(ML, doc.y).lineTo(ML + W, doc.y).lineWidth(0.5).strokeColor(NAVY).stroke();
        doc.addPage();
        currentPage++;
        drawHeader();
        drawTableHeader();
      }

      const row = movimientos[i];
      const y = doc.y;
      
      // Alternating row background
      if (i % 2 !== 0) {
        doc.rect(ML, y, W, ROW_H).fill(ROW_ALT);
      }
      
      // Left border
      doc.moveTo(ML, y).lineTo(ML, y + ROW_H).lineWidth(0.3).strokeColor(BORDER_COLOR).stroke();

      doc.fillColor('#333');
      let x = ML;

      cols.forEach((col: any) => {
        let value = '';
        switch (col.id) {
          case 'fecha': value = fmtDate(row.fecha); break;
          case 'documento': value = row.documento || ''; break;
          case 'tipoDoc': value = row.tipoDocumento || ''; break;
          case 'cuenta': value = row.cuenta || ''; break;
          case 'descripcionCuenta': value = row.descripcionCuenta || ''; break;
          case 'concepto': value = row.concepto || ''; break;
          case 'tercero': value = row.tercero || ''; break;
          case 'centroCosto': value = row.centroCosto || ''; break;
          case 'debito': value = fmt(Number(row.debito) || 0); break;
          case 'credito': value = fmt(Number(row.credito) || 0); break;
          case 'saldo': value = fmt(Number(row.saldo) || 0); break;
        }

        // Column separator
        doc.moveTo(x, y).lineTo(x, y + ROW_H).lineWidth(0.2).strokeColor(BORDER_COLOR).stroke();

        doc.fontSize(6.2).font('Helvetica').fillColor('#333')
           .text(String(value).substring(0, 55), x + 3, y + 4, { 
             width: col.w - 6, 
             align: col.align, 
             lineBreak: false 
           });
        x += col.w;
      });

      // Right border
      doc.moveTo(ML + W, y).lineTo(ML + W, y + ROW_H).lineWidth(0.3).strokeColor(BORDER_COLOR).stroke();
      // Bottom row line
      doc.moveTo(ML, y + ROW_H).lineTo(ML + W, y + ROW_H).lineWidth(0.15).strokeColor(BORDER_COLOR).stroke();

      doc.y = y + ROW_H;
    }

    // Close table bottom with thick navy line
    doc.moveTo(ML, doc.y).lineTo(ML + W, doc.y).lineWidth(1).strokeColor(NAVY).stroke();

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // TOTALS ROW
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (cfg.incluirTotales !== false) {
      const tDeb = movimientos.reduce((s: number, r: any) => s + (Number(r.debito) || 0), 0);
      const tCred = movimientos.reduce((s: number, r: any) => s + (Number(r.credito) || 0), 0);
      const saldoFinal = tDeb - tCred;

      doc.y += 6;
      const totY = doc.y;
      
      // Registros count
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(NAVY)
         .text(`Registros: ${movimientos.length}`, ML + 3, totY);
      
      // Total DÃ©bitos
      doc.text(`Total DÃ©bitos: $ ${fmt(tDeb)}`, ML + W * 0.25, totY, { width: W * 0.25, align: 'center' });
      
      // Total CrÃ©ditos
      doc.text(`Total CrÃ©ditos: $ ${fmt(tCred)}`, ML + W * 0.50, totY, { width: W * 0.25, align: 'center' });
      
      // Saldo Final - highlighted box
      const saldoBoxW = W * 0.22;
      const saldoBoxX = ML + W - saldoBoxW;
      doc.roundedRect(saldoBoxX, totY - 3, saldoBoxW, 16, 3).fill(NAVY);
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#ffffff')
         .text(`Saldo Final: $ ${fmt(Math.abs(saldoFinal))}`, saldoBoxX + 5, totY + 1, { 
           width: saldoBoxW - 10, 
           align: 'center' 
         });
      
      doc.fillColor('#000');
      doc.y = totY + 20;
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // OBSERVATIONS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (cfg.incluirObservaciones) {
      doc.y += 5;
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(NAVY)
         .text('Observaciones:', ML);
      doc.fontSize(7).font('Helvetica').fillColor('#444')
         .text(cfg.observacionesTexto || 'Consulta de movimientos contables del perÃ­odo seleccionado.\nDocumento generado para fines de informaciÃ³n y revisiÃ³n.', ML, doc.y + 2, { width: W * 0.6 });
      doc.y += 10;
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // SIGNATURES
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    if (cfg.incluirFirmas) {
      const firmantes = await pTenant.firmaUsuario.findMany({ where: { estado: 'Activo' } });
      
      // Check if we need a new page for signatures
      if (doc.y + 90 > pageBottom) {
        doc.addPage();
        currentPage++;
        drawHeader();
      }

      doc.y += 15;
      const sigY = doc.y;
      const sigColW = W * 0.25;
      const sigGap = (W - sigColW * 3 - W * 0.18) / 2; // 3 sigs + QR area

      const roles = [
        { cargo: 'Representante Legal', docLabel: 'CC.' },
        { cargo: 'Contador PÃºblico', docLabel: 'T.P.' },
        { cargo: 'Revisor Fiscal', docLabel: 'T.P.' }
      ];

      roles.forEach((role, idx) => {
        const firmante = firmantes.find((f: any) => f.cargo === role.cargo);
        const x = ML + (sigColW + sigGap) * idx;

        // Signature image if available
        if (firmante?.firmaImagen) {
          try {
            const sigData = firmante.firmaImagen.replace(/^data:image\/\w+;base64,/, '');
            const sigBuf = Buffer.from(sigData, 'base64');
            doc.image(sigBuf, x + sigColW * 0.15, sigY, { width: sigColW * 0.7, height: 30 });
          } catch {}
        }

        // Signature line
        const lineY = sigY + 35;
        doc.moveTo(x + 5, lineY).lineTo(x + sigColW - 5, lineY).lineWidth(0.5).strokeColor('#666').stroke();
        
        // Name
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#333')
           .text(firmante?.nombre || '________________________', x, lineY + 4, { width: sigColW, align: 'center' });
        
        // Role
        doc.fontSize(6.5).font('Helvetica').fillColor('#555')
           .text(role.cargo, x, lineY + 14, { width: sigColW, align: 'center' });
        
        // Document/TP
        if (firmante?.tarjetaProfesional) {
          doc.text(`${role.docLabel} ${firmante.tarjetaProfesional}`, x, lineY + 22, { width: sigColW, align: 'center' });
        } else if (firmante?.documento) {
          doc.text(`${role.docLabel} ${firmante.documento}`, x, lineY + 22, { width: sigColW, align: 'center' });
        }
      });

      // QR code area placeholder
      const qrX = ML + W - W * 0.15;
      const qrSize = 50;
      doc.rect(qrX, sigY + 2, qrSize, qrSize).lineWidth(0.5).strokeColor(BORDER_COLOR).stroke();
      // Draw simple QR placeholder pattern
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if ((r < 2 || r > 4) && (c < 2 || c > 4) || (r >= 2 && r <= 4 && c >= 2 && c <= 4) || (r + c) % 3 === 0) {
            doc.rect(qrX + 4 + c * 6, sigY + 6 + r * 6, 5, 5).fill(NAVY);
          }
        }
      }
      doc.fontSize(5).font('Helvetica').fillColor('#666')
         .text('Verifique la validez', qrX - 5, sigY + qrSize + 6, { width: qrSize + 10, align: 'center' })
         .text('de este documento', qrX - 5, sigY + qrSize + 12, { width: qrSize + 10, align: 'center' })
         .text('escaneando el cÃ³digo QR', qrX - 5, sigY + qrSize + 18, { width: qrSize + 10, align: 'center' });
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // FOOTER BAR (on every page)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const totalPages = doc.bufferedPageRange().count;
    
    for (let p = 0; p < totalPages; p++) {
      doc.switchToPage(p);
      
      // Footer bar
      const footerY = PH - 35;
      doc.rect(ML, footerY, W, 22).fill(NAVY);
      
      const footerItems = [
        empresa?.sitioWeb ? `ðŸŒ  ${empresa.sitioWeb}` : 'ðŸŒ  www.empresa.com',
        empresa?.correoElectronico ? `âœ‰  ${empresa.correoElectronico}` : 'âœ‰  info@empresa.com',
        empresa?.telefono1 ? `ðŸ“ž  ${empresa.telefono1}` : 'ðŸ“ž  (000) 000 0000'
      ];
      
      const footerColW = W / 3;
      footerItems.forEach((item, idx) => {
        doc.fontSize(6.5).font('Helvetica').fillColor('#ffffff')
           .text(item, ML + footerColW * idx, footerY + 6, { width: footerColW, align: 'center' });
      });

      // Right margin vertical text
      doc.save();
      doc.translate(ML + W + 18, PH / 2 + 80);
      doc.rotate(-90);
      doc.fontSize(6).font('Helvetica').fillColor('#ccc')
         .text('Documento generado electrÃ³nicamente - AccountingPro', 0, 0);
      doc.restore();

      // Update page numbers in header
      // We already have the page number in the header drawn during rendering
    }

    // Fix page numbers (update them now that we know total)
    for (let p = 0; p < totalPages; p++) {
      doc.switchToPage(p);
      // Overlay corrected page number
      const pageNumY = doc.options.margins.top + 50;
      const rightX = ML + W * 0.65;
      const rightW = W * 0.35;
      // White rectangle to cover old text
      doc.rect(rightX + rightW - 100, pageNumY - 1, 100, 11).fill('#fff');
      doc.fontSize(7).font('Helvetica').fillColor('#555')
         .text(`PÃ¡gina: ${p + 1} de ${totalPages}`, rightX, pageNumY, { width: rightW, align: 'right' });
    }

    doc.end();
    const pdfBuffer = await pdfPromise;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Movimientos_${now.getTime()}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error: any) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

export default router;
