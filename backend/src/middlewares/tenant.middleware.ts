import { Request, Response, NextFunction } from 'express';
import { PrismaClient as PrismaGlobal } from '@prisma/client-global';
import { PrismaClient as PrismaTenant } from '@prisma/client-tenant';

const prismaGlobal = new PrismaGlobal();

export const resolveTenant = async (req: any, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.params.tenantId;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Falta identificador de empresa (x-tenant-id)' });
    }

    const empresa = await prismaGlobal.empresaGlobal.findFirst({
      where: { codigo_empresa: tenantId as string }
    });

    if (!empresa) {
      return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
    }

    const tenantPrisma = new PrismaTenant({
      datasources: {
        db: {
          url: `file:./${empresa.nombre_bd}.db`
        }
      }
    });

    req.tenantPrisma = tenantPrisma;
    
    // Almacenar función de desconexión para llamarla al finalizar la request (opcional pero recomendado)
    res.on('finish', () => {
      tenantPrisma.$disconnect();
    });

    next();
  } catch (error) {
    console.error('Error resolviendo tenant:', error);
    res.status(500).json({ success: false, message: 'Error interno resolviendo tenant' });
  }
};
