const { PrismaClient } = require('@prisma/client-tenant');

async function main() {
  const prisma = new PrismaClient({
    datasources: { db: { url: 'file:./EMP000004_AAAAAA.db' } }
  });

  try {
    const config = await prisma.configuracionEmpresa.findFirst();
    if (config) {
      // Clear existing
      await prisma.empresaImpuesto.deleteMany();

      // Seed
      await prisma.empresaImpuesto.createMany({
        data: [
          {
            empresaId: config.id,
            nombre: 'Impuesto al Valor Agregado (IVA)',
            codigoDian: '01',
            tarifa: 19.00,
            aplicaFuente: true,
            aplicaIva: true,
            aplicaIca: false
          },
          {
            empresaId: config.id,
            nombre: 'Impuesto de Industria y Comercio (ICA)',
            codigoDian: '07',
            tarifa: 0.50,
            aplicaFuente: true,
            aplicaIva: false,
            aplicaIca: true
          },
          {
            empresaId: config.id,
            nombre: 'Impuesto de Renta',
            codigoDian: '05',
            tarifa: 35.00,
            aplicaFuente: true,
            aplicaIva: false,
            aplicaIca: false
          }
        ]
      });
      console.log('Seed exitoso');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
