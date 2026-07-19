import { PrismaClient as PrismaTenant } from '../node_modules/@prisma/client-tenant';

const prisma = new PrismaTenant({
  datasources: {
    db: {
      url: 'file:./EMP000004_AAAAAA.db'
    }
  }
});

async function main() {
  console.log("Checking relative database path...");
  try {
    const conf = await prisma.configuracionEmpresa.findFirst();
    console.log("Config:", conf?.razonSocial);
  } catch (err: any) {
    console.error("Relative path query failed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
