import { Router } from 'express';
import { PrismaClient as PrismaTenant } from '@prisma/client-tenant';
import { PrismaClient as PrismaGlobal } from '@prisma/client-global';

const prismaGlobal = new PrismaGlobal();
const getTenantPrisma = async (codigoEmpresa: string) => {
  const empresa = await prismaGlobal.empresaGlobal.findFirst({
    where: { codigo_empresa: codigoEmpresa }
  });
  if (!empresa) throw new Error('Empresa no encontrada');
  return new PrismaTenant({ datasources: { db: { url: `file:./${empresa.nombre_bd}.db` } } });
};

const router = Router();

router.get('/', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  try {
    const prisma = await getTenantPrisma(tenantId);
    const grupos = await prisma.grupoOperacion.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
    res.json({ success: true, data: grupos });
  } catch (error) {
    console.error('Error fetching grupos:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

router.post('/', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const { codigo, nombre } = req.body;
  
  if (!codigo || !nombre) {
    return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });
  }

  try {
    const prisma = await getTenantPrisma(tenantId);
    const existing = await prisma.grupoOperacion.findUnique({ where: { codigo } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'El código ya existe' });
    }

    const grupo = await prisma.grupoOperacion.create({
      data: { codigo, nombre }
    });
    res.json({ success: true, data: grupo });
  } catch (error) {
    console.error('Error creating grupo:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

router.put('/:id', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const { id } = req.params;
  const { codigo, nombre } = req.body;
  try {
    const prisma = await getTenantPrisma(tenantId);
    const grupo = await prisma.grupoOperacion.update({
      where: { id: Number(id) },
      data: { codigo, nombre }
    });
    res.json({ success: true, data: grupo });
  } catch (error) {
    console.error('Error updating grupo:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

router.delete('/:id', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const { id } = req.params;
  try {
    const prisma = await getTenantPrisma(tenantId);
    await prisma.grupoOperacion.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting grupo:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

export default router;

