import { Router } from 'express';
import { PrismaClient as PrismaTenant } from '@prisma/client-tenant';
import { PrismaClient as PrismaGlobal } from '@prisma/client-global';

const prismaGlobal = new PrismaGlobal();

const router = Router();

router.get('/', async (req, res) => {
  const { tenantId } = req as any;
  try {
    const prisma = req.tenantPrisma;
    const cuentas = await prisma.cuentaBancaria.findMany({
      include: {
        banco: true,
        sucursal: true,
        cuentaContable: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: cuentas });
  } catch (error) {
    console.error('Error fetching cuentas bancarias:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

router.post('/', async (req, res) => {
  const { tenantId } = req as any;
  const data = req.body;
  
  if (!data.numeroCuenta || !data.bancoId || !data.sucursalId || !data.cuentaContableId || !data.tipo) {
    return res.status(400).json({ success: false, message: 'Faltan datos requeridos (banco, tipo, número de cuenta, sucursal o cuenta contable)' });
  }

  try {
    const prisma = req.tenantPrisma;
    
    // Validar si el número de cuenta ya existe
    const existing = await prisma.cuentaBancaria.findUnique({ where: { numeroCuenta: data.numeroCuenta } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'El número de cuenta bancaria ya está registrado' });
    }

    const cuenta = await prisma.cuentaBancaria.create({
      data: {
        bancoId: Number(data.bancoId),
        tipo: data.tipo,
        numeroCuenta: data.numeroCuenta,
        sucursalId: Number(data.sucursalId),
        cuentaContableId: Number(data.cuentaContableId),
        grupoOperacionId: data.grupoOperacionId ? Number(data.grupoOperacionId) : null,
        consecutivoCheque: data.consecutivoCheque || null,
        formatoCheque: data.formatoCheque || null,
        formatoProveedor: data.formatoProveedor || null,
        activo: data.activo !== undefined ? data.activo : true,
      },
      include: {
        banco: true,
        sucursal: true,
        cuentaContable: true
      }
    });
    res.json({ success: true, data: cuenta });
  } catch (error) {
    console.error('Error creating cuenta bancaria:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor al crear cuenta bancaria' });
  }
});

router.put('/:id', async (req, res) => {
  const { tenantId } = req as any;
  const { id } = req.params;
  const data = req.body;

  try {
    const prisma = req.tenantPrisma;
    
    // Check uniqueness if changing account number
    if (data.numeroCuenta) {
      const existing = await prisma.cuentaBancaria.findUnique({ where: { numeroCuenta: data.numeroCuenta } });
      if (existing && existing.id !== Number(id)) {
        return res.status(400).json({ success: false, message: 'El número de cuenta bancaria ya está en uso' });
      }
    }

    const cuenta = await prisma.cuentaBancaria.update({
      where: { id: Number(id) },
      data: {
        bancoId: data.bancoId ? Number(data.bancoId) : undefined,
        tipo: data.tipo,
        numeroCuenta: data.numeroCuenta,
        sucursalId: data.sucursalId ? Number(data.sucursalId) : undefined,
        cuentaContableId: data.cuentaContableId ? Number(data.cuentaContableId) : undefined,
        grupoOperacionId: data.grupoOperacionId !== undefined ? (data.grupoOperacionId ? Number(data.grupoOperacionId) : null) : undefined,
        consecutivoCheque: data.consecutivoCheque,
        formatoCheque: data.formatoCheque,
        formatoProveedor: data.formatoProveedor,
        activo: data.activo,
      },
      include: {
        banco: true,
        sucursal: true,
        cuentaContable: true
      }
    });
    res.json({ success: true, data: cuenta });
  } catch (error) {
    console.error('Error updating cuenta bancaria:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar la cuenta bancaria' });
  }
});

router.delete('/:id', async (req, res) => {
  const { tenantId } = req as any;
  const { id } = req.params;

  try {
    const prisma = req.tenantPrisma;
    await prisma.cuentaBancaria.delete({
      where: { id: Number(id) }
    });
    res.json({ success: true, message: 'Cuenta bancaria eliminada' });
  } catch (error) {
    console.error('Error deleting cuenta bancaria:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar la cuenta bancaria (es posible que tenga operaciones asociadas)' });
  }
});

export default router;
