import { Router, Request, Response } from 'express';
import { PrismaClient as PrismaTenant } from '@prisma/client-tenant';
import { PrismaClient as PrismaGlobal } from '@prisma/client-global';
import { LedgerService } from '../services/contabilidad/ledger.service';
import { resolveTenant } from "../middlewares/tenant.middleware";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure Multer for Documento Soporte
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/DocumentoSoporte');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

const router = Router();
router.use(resolveTenant);
const prismaGlobal = new PrismaGlobal();


// GET /api/contabilidad/:tenantId/comprobantes
router.get('/:tenantId/comprobantes', async (req: any, res: any) => {
  try {
    const { tenantId } = req.params;
    res.json({
      success: true,
      data: [],
      message: 'Módulo de Comprobantes en construcción'
    });
  } catch (error: any) {
    console.error('Error fetching comprobantes:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/contabilidad/:tenantId/comprobantes
router.post('/:tenantId/comprobantes', upload.array('soportes', 10), async (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const data = req.body.data ? JSON.parse(req.body.data) : req.body;
  let pTenant;

  try {
    pTenant = req.tenantPrisma;

    const empresaGlobal = await prismaGlobal.empresaGlobal.findFirst({
      where: { codigo_empresa: tenantId }
    });

    // Start Transaction
    const result = await pTenant.$transaction(async (tx) => {
      const { encabezado, movimientos } = data;
      
      if (!movimientos || movimientos.length < 2) {
        throw new Error('El comprobante debe tener al menos dos líneas de movimiento.');
      }

      let empresaTerceroId: number | null = null;
      if (empresaGlobal && empresaGlobal.nit) {
        const t = await tx.tercero.findFirst({ where: { identificacion: empresaGlobal.nit } });
        if (t) empresaTerceroId = t.id;
      }

      let totalDebito = 0;
      for (const m of movimientos) {
        totalDebito += Number(m.debito || 0);
        if (!m.cuentaId) throw new Error('Todas las líneas deben tener una cuenta asociada.');
      }

      // Validar partida doble usando el nuevo servicio con precisión decimal
      LedgerService.validateDoubleEntry(movimientos);

      const tipoDocId = Number(encabezado.tipoDocumentoId);
      const numeracion = await tx.numeracion.findFirst({
        where: { tipoDocumentoId: tipoDocId }
      });

      if (!numeracion) {
        throw new Error('El tipo de documento no tiene numeración configurada.');
      }

      // Generate Consecutive & Anti-collision Logic
      const isManual = numeracion.permiteManual;
      let consecutiveToUse: number;
      let originalConsecutive: number | null = null;
      let warningMessage: string | null = null;

      if (isManual && encabezado.numero) {
        // Manual Mode
        const manualNum = Number(encabezado.numero.toString().replace(/\D/g, ''));
        if (isNaN(manualNum) || manualNum <= 0) {
          throw new Error('El número manual ingresado es inválido.');
        }
        consecutiveToUse = manualNum;
        
        const existe = await tx.comprobante.findFirst({ where: { tipoDocumentoId: tipoDocId, numero: consecutiveToUse } });
        if (existe) {
          throw new Error(`El consecutivo manual ${consecutiveToUse} ya está en uso.`);
        }
      } else {
        // Automatic Mode
        consecutiveToUse = numeracion.consecutivoActual;
        if (consecutiveToUse === 0) {
          consecutiveToUse = numeracion.rangoInicial;
        }
        originalConsecutive = consecutiveToUse;

        // Auto-resolver colisiones
        while (true) {
          const existe = await tx.comprobante.findFirst({ where: { tipoDocumentoId: tipoDocId, numero: consecutiveToUse } });
          if (existe) {
            consecutiveToUse++;
          } else {
            break;
          }
        }

        if (originalConsecutive !== consecutiveToUse) {
          warningMessage = `El número ${originalConsecutive} ya existía. Se guardó automáticamente como ${consecutiveToUse}.`;
        }

        // Lock/Update Consecutive solo si es automático
        await tx.numeracion.update({
          where: { id: numeracion.id },
          data: { consecutivoActual: consecutiveToUse + 1 }
        });
      }

      // 2. Insert Header
      const comprobante = await tx.comprobante.create({
        data: {
          tipoDocumentoId: tipoDocId,
          numero: consecutiveToUse,
          fecha: new Date(encabezado.fecha),
          concepto: encabezado.concepto,
          estado: 'CONTABILIZADO',
          usuarioCreacion: 'admin',
        }
      });

      // 3. Insert Lines
      const movsToInsert = movimientos.map((m: any) => ({
        comprobanteId: comprobante.id,
        cuentaId: Number(m.cuentaId),
        terceroId: m.terceroId ? Number(m.terceroId) : empresaTerceroId,
        centroCostoId: m.centroCostoId ? Number(m.centroCostoId) : null,
        cuentaBancariaId: m.cuentaBancariaId ? Number(m.cuentaBancariaId) : null,
        descripcion: m.observacion || encabezado.concepto,
        debito: Number(m.debito || 0),
        credito: Number(m.credito || 0)
      }));

      await tx.movimiento.createMany({
        data: movsToInsert
      });

      // 4. Audit
      await tx.auditoriaContable.create({
        data: {
          usuario: 'admin',
          accion: 'CREAR_COMPROBANTE',
          resultado: 'EXITO',
          detalles: `Documento ${numeracion.prefijo}${consecutiveToUse} contabilizado por ${totalDebito}`
        }
      });

      // 5. Documentos Soporte (Múltiples)
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const docSoportes = [];
        for (const file of req.files) {
          const doc = await tx.documentoSoporte.create({
            data: {
              comprobanteId: comprobante.id,
              nombreOriginal: file.originalname,
              rutaArchivo: `uploads/DocumentoSoporte/${file.filename}`,
              mimeType: file.mimetype,
              tamano: file.size
            }
          });
          docSoportes.push(doc);
        }
        (comprobante as any).documentosSoporte = docSoportes;
      }

      return { comprobante, numero: consecutiveToUse, prefijo: numeracion.prefijo, warning: warningMessage };
    });

    res.json({ success: true, message: 'Comprobante contabilizado con éxito', data: result, warning: result.warning });
  } catch (error: any) {
    console.error('Transaction failed:', error);
    res.status(400).json({ success: false, message: error.message });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

export default router;
