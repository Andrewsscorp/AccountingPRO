import { Router } from 'express';
import { PrismaClient as PrismaTenant } from '@prisma/client-tenant';
import { PrismaClient as PrismaGlobal } from '@prisma/client-global';

const prismaGlobal = new PrismaGlobal();

const router = Router();

router.get('/', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  try {
    const prisma = req.tenantPrisma;
    const sucursales = await prisma.sucursal.findMany({
      where: { activo: true },
      include: { banco: true },
      orderBy: { nombre: 'asc' }
    });
    res.json({ success: true, data: sucursales });
  } catch (error) {
    console.error('Error fetching sucursales:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

router.post('/', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const { bancoId, codigo, nombre } = req.body;
  
  if (!bancoId || !codigo || !nombre) {
    return res.status(400).json({ success: false, message: 'Faltan datos requeridos (bancoId, codigo, nombre)' });
  }

  try {
    const prisma = req.tenantPrisma;
    const existing = await prisma.sucursal.findUnique({ where: { codigo } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'El código de sucursal ya existe' });
    }

    const sucursal = await prisma.sucursal.create({
      data: { bancoId: Number(bancoId), codigo, nombre }
    });
    res.json({ success: true, data: sucursal });
  } catch (error) {
    console.error('Error creating sucursal:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

router.put('/:id', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const { id } = req.params;
  const { bancoId, codigo, nombre } = req.body;
  try {
    const prisma = req.tenantPrisma;
    const sucursal = await prisma.sucursal.update({
      where: { id: Number(id) },
      data: { bancoId: Number(bancoId), codigo, nombre }
    });
    res.json({ success: true, data: sucursal });
  } catch (error) {
    console.error('Error updating sucursal:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

router.delete('/:id', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const { id } = req.params;
  try {
    const prisma = req.tenantPrisma;
    await prisma.sucursal.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting sucursal:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

export default router;
