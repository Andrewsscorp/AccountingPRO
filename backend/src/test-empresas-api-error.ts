import { PrismaClient as PrismaGlobal } from '../node_modules/@prisma/client-global';
import { PrismaClient as PrismaTenant } from '../node_modules/@prisma/client-tenant';

const prismaGlobal = new PrismaGlobal(); // Will read GLOBAL_DATABASE_URL="file:./sistema_global.db" from .env

async function main() {
  console.log("Loading companies from global db...");
  try {
    const empresas = await prismaGlobal.empresaGlobal.findMany({
      where: { estado: 'ACTIVO' },
      orderBy: { fecha_creacion: 'desc' }
    });
    console.log("Found", empresas.length, "companies in global db.");
    
    const empresasConDetalles = await Promise.all(empresas.map(async (emp) => {
      try {
        const tenantDbUrl = `file:./${emp.nombre_bd}.db`;
        const pTenant = new PrismaTenant({ datasources: { db: { url: tenantDbUrl } } });
        const conf = await pTenant.configuracionEmpresa.findFirst();
        await pTenant.$disconnect();
        return {
          ...emp,
          dv: conf?.dv || null,
          razonSocial: conf?.razonSocial || emp.nombre_empresa,
          logoUrl: conf?.logoUrl || null
        };
      } catch (tenantError: any) {
        console.error(`  -> Error fetching tenant ${emp.nombre_bd}:`, tenantError.message);
        return {
          ...emp,
          dv: null,
          razonSocial: emp.nombre_empresa,
          logoUrl: null
        };
      }
    }));

    console.log("Successfully retrieved company details:", JSON.stringify(empresasConDetalles, null, 2));
  } catch (err: any) {
    console.error("Global Error:", err.stack);
  } finally {
    await prismaGlobal.$disconnect();
  }
}

main();
