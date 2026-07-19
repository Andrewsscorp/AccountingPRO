import path from 'path';
import fs from 'fs';
import { PrismaClient as PrismaTenant } from '@prisma/client-tenant';

interface BaseAccount {
  codigo: string;
  nombre: string;
  naturaleza: 'D' | 'C';
  acumula: boolean;
}

export const seedBasePUC = async (tenantDbUrl: string, tenantId: string) => {
  try {
    const tenantPrisma = new PrismaTenant({
      datasources: {
        db: {
          url: tenantDbUrl
        }
      }
    });
    
    // Verificar si ya hay cuentas
    const count = await tenantPrisma.planCuenta.count();
    if (count > 0) {
      console.log(`[Seeder] El tenant ${tenantId} ya tiene un Plan de Cuentas. Saltando...`);
      return;
    }

    const pucPath = path.join(__dirname, '../data/puc_colombia.json');
    const rawData = fs.readFileSync(pucPath, 'utf8');
    const accounts: BaseAccount[] = JSON.parse(rawData);

    const cuentasParaInsertar = accounts.map((acc) => {
      let tipo = 'ACTIVO';
      if (acc.codigo.startsWith('1')) tipo = 'ACTIVO';
      else if (acc.codigo.startsWith('2')) tipo = 'PASIVO';
      else if (acc.codigo.startsWith('3')) tipo = 'PATRIMONIO';
      else if (acc.codigo.startsWith('4')) tipo = 'INGRESOS';
      else if (acc.codigo.startsWith('5')) tipo = 'GASTOS';
      else if (acc.codigo.startsWith('6')) tipo = 'COSTOS_VENTAS';
      else if (acc.codigo.startsWith('7')) tipo = 'COSTOS_PRODUCCION';
      else if (acc.codigo.startsWith('8')) tipo = 'CUENTAS_ORDEN_DEUDORAS';
      else if (acc.codigo.startsWith('9')) tipo = 'CUENTAS_ORDEN_ACREEDORAS';

      let nivel = 1; // 1 digito = Clase
      if (acc.codigo.length === 2) nivel = 2; // Grupo
      else if (acc.codigo.length === 4) nivel = 3; // Cuenta
      else if (acc.codigo.length === 6) nivel = 4; // Subcuenta
      else if (acc.codigo.length >= 8) nivel = 5; // Auxiliar

      // Determinar el código del padre
      let cuentaPadreId: string | null = null;
      if (nivel === 2) cuentaPadreId = acc.codigo.substring(0, 1);
      else if (nivel === 3) cuentaPadreId = acc.codigo.substring(0, 2);
      else if (nivel === 4) cuentaPadreId = acc.codigo.substring(0, 4);
      else if (nivel === 5) cuentaPadreId = acc.codigo.substring(0, 6);

      // Si el padre no existe en el JSON original, anularlo para evitar error de FK
      if (cuentaPadreId && !accounts.some(a => a.codigo === cuentaPadreId)) {
        cuentaPadreId = null;
      }

      // Reglas transaccionales: si acumula = true -> no acepta transacciones (movimiento = false)
      // Si acumula = false -> sí acepta transacciones (movimiento = true)
      const movimiento = !acc.acumula;

      // REGLA DE TERCERO:
      // Inician con 13 (Cuentas por cobrar), 22 (Cuentas por pagar), 25 (Obligaciones laborales), 1110 (Bancos)
      let requiereTercero = false;
      if (
        acc.codigo.startsWith('13') ||
        acc.codigo.startsWith('22') ||
        acc.codigo.startsWith('25') ||
        acc.codigo.startsWith('1110')
      ) {
        requiereTercero = true;
      }

      // REGLA DE CENTRO DE COSTO:
      // Inician con 51 (Gastos Administrativos), 52 (Gastos Ventas), 7 (Costos Producción)
      let requiereCentroCosto = false;
      if (
        acc.codigo.startsWith('51') ||
        acc.codigo.startsWith('52') ||
        acc.codigo.startsWith('7')
      ) {
        requiereCentroCosto = true;
      }

      return {
        codigo: acc.codigo,
        nombre: acc.nombre,
        tipo,
        naturaleza: acc.naturaleza === 'D' ? 'DEBITO' : 'CREDITO',
        nivel,
        cuentaPadreId,
        movimiento,
        requiereTercero,
        requiereCentroCosto,
        activa: true
      };
    });

    // Ordenar por longitud de código para garantizar que los padres se inserten antes que los hijos
    cuentasParaInsertar.sort((a, b) => a.codigo.length - b.codigo.length);

    // Inserción secuencial para respetar foreign keys
    for (const cuenta of cuentasParaInsertar) {
      await tenantPrisma.planCuenta.create({
        data: cuenta
      });
    }

    console.log(`[Seeder] Plan de cuentas inicializado correctamente para tenant ${tenantId}.`);
    await tenantPrisma.$disconnect();

  } catch (error) {
    console.error(`[Seeder] Error al inicializar el PUC para tenant ${tenantId}:`, error);
    throw error;
  }
};
