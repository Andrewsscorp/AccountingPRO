const { PrismaClient } = require('@prisma/client-global'); const p = new PrismaClient(); p.empresaGlobal.findMany().then(console.log).finally(() => p.$disconnect());
