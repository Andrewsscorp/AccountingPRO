import { PrismaClient as PrismaGlobal } from '@prisma/client-global';
import { PrismaClient as PrismaTenant, Movimiento } from '@prisma/client-tenant';
import path from 'path';

const prismaGlobal = new PrismaGlobal();

export class LedgerQueryService {
  /**
   * Obtiene la instancia de Prisma de un tenant (empresa) específico.
   * Utiliza la base de datos global para buscar la información del tenant.
   * 
   * @param tenantId Identificador único de la empresa.
   * @returns Instancia de Prisma configurada para apuntar al archivo SQLite de la empresa.
   */
  public static async getTenantPrisma(tenantId: string): Promise<PrismaTenant> {
    const empresa = await prismaGlobal.empresaGlobal.findFirst({
      where: { codigo_empresa: tenantId }
    });

    if (!empresa) {
      throw new Error(`Empresa con identificador ${tenantId} no encontrada`);
    }

    // Resolviendo el path al db tomando en cuenta que los DBs de tenants
    // están en /app/AccountingPRO/backend/prisma/
    const dbPath = path.resolve(__dirname, '../../../prisma', `${empresa.nombre_bd}.db`);

    return new PrismaTenant({
      datasources: {
        db: {
          url: `file:${dbPath}`
        }
      }
    });
  }

  /**
   * Consulta el libro mayor (movimientos contables) de una empresa específica,
   * utilizando paginación basada en cursor y devolviendo resultados en orden cronológico inverso.
   * 
   * @param tenantId El identificador de la empresa.
   * @param take Cantidad de registros a devolver.
   * @param cursorId (Opcional) ID del último registro obtenido para iniciar la siguiente página.
   * @returns Un array de movimientos.
   */
  public static async getLedgerMovements(
    tenantId: string, 
    take: number = 20, 
    cursorId?: number
  ): Promise<Movimiento[]> {
    const prisma = await this.getTenantPrisma(tenantId);

    try {
      const movimientos = await prisma.movimiento.findMany({
        take,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}), // Skip 1 to not include the cursor itself
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' }
        ],
        include: {
          comprobante: true,
          cuenta: true,
          tercero: true,
          centroCosto: true,
        }
      });

      return movimientos;
    } finally {
      await prisma.$disconnect();
    }
  }
}
