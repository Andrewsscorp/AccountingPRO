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
    const bancos = await prisma.banco.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
    res.json({ success: true, data: bancos });
  } catch (error) {
    console.error('Error fetching bancos:', error);
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
    const existing = await prisma.banco.findUnique({ where: { codigo } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'El código de banco ya existe' });
    }

    const banco = await prisma.banco.create({
      data: { codigo, nombre }
    });
    res.json({ success: true, data: banco });
  } catch (error) {
    console.error('Error creating banco:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

router.put('/:id', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const { id } = req.params;
  const { codigo, nombre } = req.body;
  try {
    const prisma = await getTenantPrisma(tenantId);
    const banco = await prisma.banco.update({
      where: { id: Number(id) },
      data: { codigo, nombre }
    });
    res.json({ success: true, data: banco });
  } catch (error) {
    console.error('Error updating banco:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

router.delete('/:id', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const { id } = req.params;
  try {
    const prisma = await getTenantPrisma(tenantId);
    await prisma.banco.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting banco:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

export default router;
