import { PrismaClient } from '@prisma/client-tenant';
import { seedBasePUC } from './src/services/pucSeeder';

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./EMP000002_PREUBAS2.db'
      }
    }
  });
  await prisma.planCuenta.deleteMany();
  await prisma.$disconnect();
  await seedBasePUC('file:./EMP000002_PREUBAS2.db', 'EMP000002');
}

main().catch(console.error);
