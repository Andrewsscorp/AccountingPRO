import express from 'express';
import { PrismaClient as PrismaGlobal } from '@prisma/client-global';
import { PrismaClient as PrismaTenant } from '@prisma/client-tenant';

const router = express.Router();
const prismaGlobal = new PrismaGlobal();

const getTenantPrisma = async (codigoEmpresa: string) => {
  const empresa = await prismaGlobal.empresaGlobal.findFirst({
    where: { codigo_empresa: codigoEmpresa }
  });
  if (!empresa) throw new Error('Empresa no encontrada');
  return new PrismaTenant({ datasources: { db: { url: `file:./${empresa.nombre_bd}.db` } } });
};

// POST /search
router.post('/:tenantId/movimientos/search', async (req: any, res: any) => {
  let pTenant: any;
  try {
    pTenant = await getTenantPrisma(req.params.tenantId);
    
    const { 
      tipoFiltro, // "Documento", "Cuenta", "Tercero", "CentroCosto", "Mixto"
      tipoDocumentoId, numeroDocumento, 
      cuentaId, terceroId, centroCostoId, 
      fechaInicial, fechaFinal,
      montoMin, montoMax,
      naturaleza, concepto, estadoDocumento, usuarioCreacion,
      incluirSubcentros,
      page = 1, limit = 20
    } = req.body;

    const where: any = {};

    // Configurar filtros dinámicos
    if (tipoFiltro === 'Documento') {
      if (numeroDocumento || tipoDocumentoId) {
        where.comprobante = {};
        if (numeroDocumento) where.comprobante.numero = Number(numeroDocumento);
        if (tipoDocumentoId) where.comprobante.tipoDocumentoId = Number(tipoDocumentoId);
      }
    }

    if (cuentaId) {
      where.cuentaId = Number(cuentaId);
    }
    
    if (terceroId) {
      where.terceroId = Number(terceroId);
    }

    if (centroCostoId) {
      if (incluirSubcentros) {
        const centroPadre = await pTenant.centroCosto.findUnique({ where: { id: Number(centroCostoId) } });
        if (centroPadre && centroPadre.ruta) {
          const subcentros = await pTenant.centroCosto.findMany({
            where: { ruta: { startsWith: centroPadre.ruta } },
            select: { id: true }
          });
          const ids = subcentros.map((c: any) => c.id);
          where.centroCostoId = { in: ids };
        } else {
          where.centroCostoId = Number(centroCostoId);
        }
      } else {
        where.centroCostoId = Number(centroCostoId);
      }
    }

    // Filtros de comprobante (fechas, estado, usuarioCreacion)
    if (fechaInicial || fechaFinal || (estadoDocumento && estadoDocumento !== 'TODOS') || (usuarioCreacion && usuarioCreacion.trim() !== '')) {
      if (!where.comprobante) where.comprobante = {};
      
      if (fechaInicial || fechaFinal) {
        where.comprobante.fecha = {};
        if (fechaInicial) where.comprobante.fecha.gte = new Date(fechaInicial);
        if (fechaFinal) where.comprobante.fecha.lte = new Date(fechaFinal);
      }
      
      if (estadoDocumento && estadoDocumento !== 'TODOS') {
        where.comprobante.estado = estadoDocumento;
      }
      
      if (usuarioCreacion && usuarioCreacion.trim() !== '') {
        where.comprobante.usuarioCreacion = { contains: usuarioCreacion.trim() };
      }
    }

    // Concepto
    if (concepto && concepto.trim() !== '') {
      if (!where.AND) where.AND = [];
      where.AND.push({
        OR: [
          { descripcion: { contains: concepto.trim() } },
          { comprobante: { concepto: { contains: concepto.trim() } } }
        ]
      });
    }

    // Montos
    if (montoMin !== undefined && montoMin !== null && montoMin !== '') {
      const min = Number(montoMin);
      if (!where.AND) where.AND = [];
      where.AND.push({
        OR: [{ debito: { gte: min } }, { credito: { gte: min } }]
      });
    }
    
    if (montoMax !== undefined && montoMax !== null && montoMax !== '') {
      const max = Number(montoMax);
      if (!where.AND) where.AND = [];
      where.AND.push({
        OR: [{ debito: { lte: max } }, { credito: { lte: max } }]
      });
    }

    // Naturaleza
    if (naturaleza === 'DEBITO') {
      where.debito = { gt: 0 };
    } else if (naturaleza === 'CREDITO') {
      where.credito = { gt: 0 };
    }

    console.log("SEARCH WHERE PAYLOAD:", JSON.stringify(where, null, 2));

    // Calcular Total Movimientos (sin paginación)
    const totalRegistros = await pTenant.movimiento.count({ where });

    // Sumar Débitos y Créditos Totales (sin paginación)
    const sumas = await pTenant.movimiento.aggregate({
      where,
      _sum: { debito: true, credito: true }
    });

    const totalDebitos = sumas._sum.debito || 0;
    const totalCreditos = sumas._sum.credito || 0;
    const diferencia = totalDebitos - totalCreditos;

    // Obtener la página actual
    const skip = (page - 1) * limit;
    
    let movimientos = await pTenant.movimiento.findMany({
      where,
      include: {
        comprobante: {
          include: { tipoDocumento: true }
        },
        cuenta: true,
        tercero: true,
        centroCosto: true
      },
      orderBy: [
        { comprobante: { fecha: 'asc' } },
        { id: 'asc' }
      ],
      skip: Number(skip),
      take: Number(limit)
    });

    // Lógica para Saldo
    let saldoAcumulado = 0;
    let cuentaConsultada: any = null;

    if (tipoFiltro === 'Cuenta' && cuentaId) {
      cuentaConsultada = await pTenant.planCuenta.findUnique({ where: { id: Number(cuentaId) } });
      
      // Calcular Saldo Inicial (todos los movimientos antes del rango de fechas + páginas anteriores)
      // Pero es más fácil calcular el saldo inicial antes de ESTA página
      // El saldo antes de esta página incluye todos los movimientos que cumplan `where` que estén ANTES del skip
      // Wait, to get exact running balance for the page, we need the sum of all movements before the FIRST item on this page.
      const prevWhere = { ...where };
      // Para un running balance perfecto, necesitamos todos los movimientos de la cuenta previos a fechaInicial
      // MAS los movimientos en el rango fechaInicial..fechaFinal pero previos a `skip`.
      // Como SQLite no soporta window functions fácilmente en Prisma, podemos hacerlo en 2 pasos:
      // 1. Saldo antes de fechaInicial:
      let saldoAnteriorBase = 0;
      if (fechaInicial) {
        const sumasAnteriores = await pTenant.movimiento.aggregate({
          where: {
            cuentaId: Number(cuentaId),
            comprobante: { fecha: { lt: new Date(fechaInicial) } }
          },
          _sum: { debito: true, credito: true }
        });
        const deb = sumasAnteriores._sum.debito || 0;
        const cre = sumasAnteriores._sum.credito || 0;
        saldoAnteriorBase = cuentaConsultada?.naturaleza === 'DEBITO' ? (deb - cre) : (cre - deb);
      }

      // 2. Saldo de la página actual (movimientos desde fechaInicial que cayeron en páginas anteriores)
      if (skip > 0) {
        // Encontrar los IDs de los movimientos anteriores en la misma consulta
        const prevMovs = await pTenant.movimiento.findMany({
          where,
          orderBy: [
            { comprobante: { fecha: 'asc' } },
            { id: 'asc' }
          ],
          take: Number(skip),
          select: { debito: true, credito: true }
        });
        let debPrev = 0; let crePrev = 0;
        prevMovs.forEach((m: any) => { debPrev += m.debito; crePrev += m.credito; });
        const saldoPrev = cuentaConsultada?.naturaleza === 'DEBITO' ? (debPrev - crePrev) : (crePrev - debPrev);
        saldoAcumulado = saldoAnteriorBase + saldoPrev;
      } else {
        saldoAcumulado = saldoAnteriorBase;
      }
    }

    // Mapear resultados
    const data = movimientos.map((m: any) => {
      let saldoLinea = 0;
      
      const nat = m.cuenta.naturaleza; // "DEBITO" o "CREDITO"
      const impactoNeto = nat === 'DEBITO' ? (m.debito - m.credito) : (m.credito - m.debito);

      if (tipoFiltro === 'Cuenta' && cuentaConsultada) {
        saldoAcumulado += impactoNeto;
        saldoLinea = saldoAcumulado;
      } else {
        saldoLinea = impactoNeto; // Impacto neto por defecto para las demas consultas
      }

      return {
        id: m.id,
        fecha: m.comprobante.fecha,
        documentoId: m.comprobante.id,
        documento: `${m.comprobante.tipoDocumento.codigo}-${String(m.comprobante.numero).padStart(m.comprobante.tipoDocumento.numeraciones?.[0]?.longitud || 6, '0')}`, // Need numeraciones info for padding usually, but we will simplify
        tipoDocumento: m.comprobante.tipoDocumento.codigo,
        cuentaId: m.cuenta.id,
        cuenta: m.cuenta.codigo,
        descripcionCuenta: m.cuenta.nombre,
        concepto: m.descripcion || m.comprobante.concepto,
        tercero: m.tercero ? `${m.tercero.identificacion} - ${m.tercero.nombreComercial || m.tercero.razonSocial || (m.tercero.nombre1 + ' ' + m.tercero.apellido1)}` : '',
        centroCosto: m.centroCosto ? `${m.centroCosto.codigo} - ${m.centroCosto.nombre}` : '',
        debito: m.debito,
        credito: m.credito,
        saldo: saldoLinea
      };
    });

    res.json({
      success: true,
      data,
      total: totalRegistros,
      totalDebitos,
      totalCreditos,
      diferencia
    });

  } catch (error: any) {
    console.error('Error fetching movimientos:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// GET /export/excel
router.get('/:tenantId/movimientos/export/excel', async (req: any, res: any) => {
  // Lógica de exportación a Excel
  // Omitida por ahora, se puede implementar usando exceljs
  res.json({ success: false, message: "Exportación a Excel en desarrollo" });
});

// POST /export/pdf
import { PdfReportService } from '../services/pdf/PdfReportService';
import { PdfExportService } from '../services/pdf/PdfExportService';

router.post('/:tenantId/movimientos/export/pdf', async (req: any, res: any) => {
  let pTenant: any;
  try {
    pTenant = await getTenantPrisma(req.params.tenantId);
    
    const { 
      configuracion, // { paperSize, columnasIds, incluirTotales... }
      filtros // { tipoFiltro, cuentaId, ... }
    } = req.body;

    const { 
      tipoFiltro, 
      tipoDocumentoId, numeroDocumento, 
      cuentaId, terceroId, centroCostoId, 
      fechaInicial, fechaFinal,
      montoMin, montoMax,
      naturaleza, concepto, estadoDocumento, usuarioCreacion,
      incluirSubcentros
    } = filtros;

    const where: any = {};

    if (tipoFiltro === 'Documento') {
      if (numeroDocumento || tipoDocumentoId) {
        where.comprobante = {};
        if (numeroDocumento) where.comprobante.numero = Number(numeroDocumento);
        if (tipoDocumentoId) where.comprobante.tipoDocumentoId = Number(tipoDocumentoId);
      }
    }

    if (cuentaId) {
      where.cuentaId = Number(cuentaId);
    }
    
    if (terceroId) {
      where.terceroId = Number(terceroId);
    }

    if (centroCostoId) {
      if (incluirSubcentros) {
        const centroPadre = await pTenant.centroCosto.findUnique({ where: { id: Number(centroCostoId) } });
        if (centroPadre && centroPadre.ruta) {
          const subcentros = await pTenant.centroCosto.findMany({
            where: { ruta: { startsWith: centroPadre.ruta } },
            select: { id: true }
          });
          where.centroCostoId = { in: subcentros.map((c: any) => c.id) };
        } else {
          where.centroCostoId = Number(centroCostoId);
        }
      } else {
        where.centroCostoId = Number(centroCostoId);
      }
    }

    if (fechaInicial || fechaFinal || (estadoDocumento && estadoDocumento !== 'TODOS') || (usuarioCreacion && usuarioCreacion.trim() !== '')) {
      if (!where.comprobante) where.comprobante = {};
      if (fechaInicial || fechaFinal) {
        where.comprobante.fecha = {};
        if (fechaInicial) where.comprobante.fecha.gte = new Date(fechaInicial);
        if (fechaFinal) where.comprobante.fecha.lte = new Date(fechaFinal);
      }
      if (estadoDocumento && estadoDocumento !== 'TODOS') where.comprobante.estado = estadoDocumento;
      if (usuarioCreacion && usuarioCreacion.trim() !== '') where.comprobante.usuarioCreacion = { contains: usuarioCreacion.trim() };
    }

    if (concepto && concepto.trim() !== '') {
      if (!where.AND) where.AND = [];
      where.AND.push({
        OR: [
          { descripcion: { contains: concepto.trim() } },
          { comprobante: { concepto: { contains: concepto.trim() } } }
        ]
      });
    }

    if (montoMin !== undefined && montoMin !== null && montoMin !== '') {
      if (!where.AND) where.AND = [];
      where.AND.push({ OR: [{ debito: { gte: Number(montoMin) } }, { credito: { gte: Number(montoMin) } }] });
    }
    
    if (montoMax !== undefined && montoMax !== null && montoMax !== '') {
      if (!where.AND) where.AND = [];
      where.AND.push({ OR: [{ debito: { lte: Number(montoMax) } }, { credito: { lte: Number(montoMax) } }] });
    }

    if (naturaleza === 'DEBITO') where.debito = { gt: 0 };
    else if (naturaleza === 'CREDITO') where.credito = { gt: 0 };

    const totalRegistros = await pTenant.movimiento.count({ where });
    const sumas = await pTenant.movimiento.aggregate({
      where, _sum: { debito: true, credito: true }
    });

    const movimientos = await pTenant.movimiento.findMany({
      where,
      include: {
        comprobante: { include: { tipoDocumento: true } },
        cuenta: true, tercero: true, centroCosto: true
      },
      orderBy: [{ comprobante: { fecha: 'asc' } }, { id: 'asc' }]
    });

    let saldoAcumulado = 0;
    if (tipoFiltro === 'Cuenta' && cuentaId && fechaInicial) {
      const cuentaConsultada = await pTenant.planCuenta.findUnique({ where: { id: Number(cuentaId) } });
      const sumasAnteriores = await pTenant.movimiento.aggregate({
        where: {
          cuentaId: Number(cuentaId),
          comprobante: { fecha: { lt: new Date(fechaInicial) } }
        },
        _sum: { debito: true, credito: true }
      });
      const deb = sumasAnteriores._sum.debito || 0;
      const cre = sumasAnteriores._sum.credito || 0;
      saldoAcumulado = cuentaConsultada?.naturaleza === 'DEBITO' ? (deb - cre) : (cre - deb);
    }

    const data = movimientos.map((m: any) => {
      const nat = m.cuenta.naturaleza;
      const impactoNeto = nat === 'DEBITO' ? (m.debito - m.credito) : (m.credito - m.debito);
      let saldoLinea = impactoNeto;

      if (tipoFiltro === 'Cuenta' && cuentaId) {
        saldoAcumulado += impactoNeto;
        saldoLinea = saldoAcumulado;
      }
      return { ...m, saldo: saldoLinea };
    });

    const totals = {
      registros: totalRegistros,
      debitos: sumas._sum.debito || 0,
      creditos: sumas._sum.credito || 0
    };

    // Generar PDF
    const pdfBuffer = await PdfReportService.generarReporte(pTenant, { ...configuracion, filtros }, data, totals);

    // Registrar Auditoría y Guardar
    const usuarioId = req.headers['x-user-id'] || 'Sistema'; // Normally from auth middleware
    const auditInfo = await PdfExportService.registrarYGuardar(
      pTenant, req.params.tenantId, usuarioId, 'CONSULTA_MOVIMIENTOS',
      filtros, configuracion.columnasIds, totalRegistros, pdfBuffer
    );

    // Enviar Buffer al cliente
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="reporte_${auditInfo.uuid}.pdf"`);
    res.setHeader('X-Report-Id', auditInfo.uuid);
    res.send(pdfBuffer);

  } catch (error: any) {
    console.error('Error exportando PDF:', error);
    res.status(500).json({ success: false, message: error.message || 'Error del servidor al exportar PDF' });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

export default router;
