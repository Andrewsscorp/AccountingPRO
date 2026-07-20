import { PrismaClient as PrismaGlobal } from '@prisma/client-global';

const globalPrisma = new PrismaGlobal({
  datasources: {
    db: {
      url: "file:../prisma/global.db"
    }
  }
});
export { globalPrisma };
