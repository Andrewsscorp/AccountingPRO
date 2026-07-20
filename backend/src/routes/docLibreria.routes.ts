import { Router, Request, Response } from 'express';
import { PrismaClient as PrismaTenant } from '@prisma/client-tenant';
import { PrismaClient as PrismaGlobal } from '@prisma/client-global';
import { resolveTenant } from "../middlewares/tenant.middleware";

const router = Router();
const prismaGlobal = new PrismaGlobal();

router.use(resolveTenant);

// GET /api/contabilidad/:tenantId/doc-libreria
router.get('/:tenantId/doc-libreria', async (req: Request, res: Response) => {
  let pTenant;
  try {
    const { tenantId } = req.params;
    pTenant = req.tenantPrisma;
    
    const libreria = await pTenant.docLibreria.findMany({
      include: {
        tipoDocumento: true,
        movimientos: {
          include: {
            cuenta: true,
            tercero: true,
            centroCosto: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ success: true, data: libreria });
  } catch (error: any) {
    console.error('Error fetching doc-libreria:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// POST /api/contabilidad/:tenantId/doc-libreria
router.post('/:tenantId/doc-libreria', async (req: Request, res: Response) => {
  let pTenant;
  try {
    const { tenantId } = req.params;
    const { nombrePlantilla, encabezado, movimientos } = req.body;
    
    if (!nombrePlantilla) {
      throw new Error("El nombre de la plantilla es obligatorio.");
    }

    pTenant = req.tenantPrisma;

    const docLibreria = await pTenant.docLibreria.create({
      data: {
        nombrePlantilla,
        tipoDocumentoId: encabezado.tipoDocumentoId ? Number(encabezado.tipoDocumentoId) : null,
        fecha: encabezado.fecha ? new Date(encabezado.fecha) : null,
        concepto: encabezado.concepto || null,
        afecta: encabezado.afecta || null,
        referencia: encabezado.referencia || null,
        comentarios: encabezado.comentarios || null,
        usuarioCreacion: 'admin',
        movimientos: {
          create: movimientos.map((m: any) => ({
            cuentaId: m.cuentaId ? Number(m.cuentaId) : null,
            terceroId: m.terceroId ? Number(m.terceroId) : null,
            centroCostoId: m.centroCostoId ? Number(m.centroCostoId) : null,
            descripcion: m.observacion || null,
            debito: Number(m.debito || 0),
            credito: Number(m.credito || 0),
            baseImpuesto: Number(m.baseImpuesto || 0)
          }))
        }
      },
      include: { movimientos: true }
    });

    res.json({ success: true, data: docLibreria, message: "Plantilla guardada correctamente" });
  } catch (error: any) {
    console.error('Error saving doc-libreria:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

// DELETE /api/contabilidad/:tenantId/doc-libreria/:id
router.delete('/:tenantId/doc-libreria/:id', async (req: Request, res: Response) => {
  let pTenant;
  try {
    const { tenantId, id } = req.params;
    pTenant = req.tenantPrisma;
    await pTenant.docLibreria.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: "Plantilla eliminada correctamente" });
  } catch (error: any) {
    console.error('Error deleting doc-libreria:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (pTenant) await pTenant.$disconnect();
  }
});

export default router;
