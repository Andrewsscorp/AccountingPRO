import { PrismaClient as PrismaTenant } from '@prisma/client-tenant';
import { seedBasePUC } from './pucSeeder';

async function reseedDb(url: string, tenantId: string) {
  const p = new PrismaTenant({ datasources: { db: { url } } });
  console.log(`Borrando cuentas de ${tenantId}...`);
  await p.planCuenta.deleteMany();
  await p.$disconnect();
  console.log(`Reseeding ${tenantId}...`);
  await seedBasePUC(url, tenantId);
}

async function run() {
  await reseedDb('file:./EMP000001_ANDREWTCH.db', 'EMP000001');
  await reseedDb('file:./EMP000002_PREUBAS2.db', 'EMP000002');
  await reseedDb('file:./EMP000003_QWERTY.db', 'EMP000003');
  console.log('Terminado todo el reseed.');
}

run().catch(console.error);
