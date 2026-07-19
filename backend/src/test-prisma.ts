import { PrismaClient as PrismaTenant } from '../node_modules/@prisma/client-tenant';

const prisma = new PrismaTenant({
  datasources: {
    db: {
      url: 'file:C:/Users/Hawk/.gemini/antigravity/scratch/AccountingPRO/backend/prisma/EMP000001_ANDREWTCH.db'
    }
  }
});

async function main() {
  console.log("Querying table info for ConfiguracionEmpresa in EMP000001_ANDREWTCH.db...");
  try {
    const info = await prisma.$queryRawUnsafe("PRAGMA table_info(ConfiguracionEmpresa)");
    console.log("Columns:", info);
  } catch (err: any) {
    console.error("Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
