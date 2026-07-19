import { PrismaClient as PrismaGlobal } from '@prisma/client-global';
import { execSync } from 'child_process';

const prismaGlobal = new PrismaGlobal();

async function pushTenants() {
  const empresas = await prismaGlobal.empresaGlobal.findMany();
  for (const emp of empresas) {
    console.log(`Pushing schema to tenant DB: ${emp.nombre_bd}.db`);
    try {
      execSync('npx prisma db push --schema=prisma/tenant.schema.prisma --accept-data-loss', {
        env: {
          ...process.env,
          TENANT_DATABASE_URL: `file:./${emp.nombre_bd}.db`
        },
        stdio: 'inherit'
      });
    } catch (error) {
      console.error(`Error pushing to ${emp.nombre_bd}:`, error);
    }
  }
}

pushTenants().then(() => {
  console.log('All tenants pushed');
  process.exit(0);
});
