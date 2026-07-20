import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient as PrismaGlobal } from '@prisma/client-global';
import { PrismaClient as PrismaTenant } from '@prisma/client-tenant';

const prismaGlobal = new PrismaGlobal();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_dev_only';

export const resolveTenant = async (req: any, res: Response, next: NextFunction) => {
  try {
    // 1. Verify authentication
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }

    req.usuarioId = decoded.userId;

    // 2. Resolve Tenant ID
    const tenantId = req.headers['x-tenant-id'] || req.params.tenantId;
    if (!tenantId) {
      // Si no se requiere un tenant específico (ej. listado de empresas), podemos dejar pasar si la ruta lo soporta.
      // Pero 'resolveTenant' normalmente espera un tenant. Devolveremos error 400.
      return res.status(400).json({ success: false, message: 'Falta identificador de empresa (x-tenant-id)' });
    }

    // 3. Verify user has access to this tenant (Authorization)
    const empresa = await prismaGlobal.empresaGlobal.findFirst({
      where: { codigo_empresa: tenantId as string }
    });

    if (!empresa) {
      return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
    }

    const hasAccess = await prismaGlobal.usuarioEmpresa.findUnique({
      where: {
        usuarioId_empresaId: {
          usuarioId: decoded.userId,
          empresaId: empresa.id
        }
      }
    });

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'No tiene permiso para acceder a esta empresa' });
    }

    // 4. Setup Tenant Prisma Client
    const tenantPrisma = new PrismaTenant({
      datasources: {
        db: {
          url: `file:./${empresa.nombre_bd}.db`
        }
      }
    });

    req.tenantPrisma = tenantPrisma;
    
    // Almacenar función de desconexión para llamarla al finalizar la request
    res.on('finish', () => {
      tenantPrisma.$disconnect();
    });

    next();
  } catch (error) {
    console.error('Error resolviendo tenant:', error);
    res.status(500).json({ success: false, message: 'Error interno resolviendo tenant' });
  }
};
