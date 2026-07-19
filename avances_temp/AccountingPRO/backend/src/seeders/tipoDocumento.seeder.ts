import { PrismaClient as PrismaTenant } from '@prisma/client-tenant';

const defaultTipos = [
  { codigo: 'CC', nombre: 'Comprobante de Contabilidad', modulo: 'Contabilidad', clase: 'Comprobante Contable', requiereTercero: false, requiereCentroCosto: false, roles: ['Administrador', 'Contador', 'Auxiliar Contable'] },
  { codigo: 'CE', nombre: 'Comprobante de Egreso', modulo: 'Tesorería', clase: 'Egreso', requiereTercero: true, requiereCentroCosto: false, roles: ['Administrador', 'Tesorería', 'Contador'] },
  { codigo: 'RC', nombre: 'Recibo de Caja', modulo: 'Tesorería', clase: 'Ingreso', requiereTercero: true, requiereCentroCosto: false, roles: ['Administrador', 'Tesorería', 'Contador'] },
  { codigo: 'AJ', nombre: 'Comprobante de Ajuste', modulo: 'Contabilidad', clase: 'Ajuste', requiereTercero: false, requiereCentroCosto: false, roles: ['Administrador', 'Contador'] },
  { codigo: 'CI', nombre: 'Comprobante Inicial', modulo: 'Contabilidad', clase: 'Apertura', requiereTercero: false, requiereCentroCosto: false, roles: ['Administrador', 'Contador'] },
  { codigo: 'CF', nombre: 'Comprobante de Cierre', modulo: 'Contabilidad', clase: 'Cierre', requiereTercero: false, requiereCentroCosto: false, roles: ['Administrador', 'Contador'] },
  { codigo: 'ND', nombre: 'Nota Débito', modulo: 'Ventas', clase: 'Nota Débito', requiereTercero: true, requiereCentroCosto: false, roles: ['Administrador', 'Contador', 'Gerencia'] },
  { codigo: 'NC', nombre: 'Nota Crédito', modulo: 'Ventas', clase: 'Nota Crédito', requiereTercero: true, requiereCentroCosto: false, roles: ['Administrador', 'Contador', 'Gerencia'] },
  { codigo: 'FV', nombre: 'Factura Venta', modulo: 'Ventas', clase: 'Factura', requiereTercero: true, requiereCentroCosto: false, roles: ['Administrador', 'Ventas', 'Contador'] },
  { codigo: 'FC', nombre: 'Factura Compra', modulo: 'Compras', clase: 'Factura', requiereTercero: true, requiereCentroCosto: false, roles: ['Administrador', 'Compras', 'Contador'] },
  { codigo: 'PA', nombre: 'Pago Proveedor', modulo: 'Tesorería', clase: 'Egreso', requiereTercero: true, requiereCentroCosto: false, roles: ['Administrador', 'Tesorería', 'Contador'] },
  { codigo: 'PR', nombre: 'Provisiones', modulo: 'Contabilidad', clase: 'Comprobante Contable', requiereTercero: false, requiereCentroCosto: false, roles: ['Administrador', 'Contador'] },
  { codigo: 'CA', nombre: 'Comprobante Ajuste', modulo: 'Contabilidad', clase: 'Ajuste', requiereTercero: false, requiereCentroCosto: false, roles: ['Administrador', 'Contador'] }
];

export async function seedTiposDocumento(tenantDbUrl: string) {
  const pTenant = new PrismaTenant({ datasources: { db: { url: tenantDbUrl } } });
  
  try {
    for (const doc of defaultTipos) {
      const exists = await pTenant.tipoDocumento.findUnique({ where: { codigo: doc.codigo } });
      if (!exists) {
        const basePermisos = doc.roles.map(r => ({
          rolId: r,
          crear: true,
          editar: r === 'Administrador' || r === 'Contador',
          anular: r === 'Administrador' || r === 'Contador',
          consultar: true,
          imprimir: true
        }));

        await pTenant.tipoDocumento.create({
          data: {
            codigo: doc.codigo,
            nombre: doc.nombre,
            modulo: doc.modulo,
            clase: doc.clase,
            requiereTercero: doc.requiereTercero,
            requiereCentroCosto: doc.requiereCentroCosto,
            esSistema: true,
            activo: true,
            usuarioCreacion: 'sistema',
            numeraciones: {
              create: [
                {
                  prefijo: doc.codigo,
                  rangoInicial: 1,
                  consecutivoActual: 0,
                  longitud: 6,
                  rellenoCeros: true,
                  activa: true
                }
              ]
            },
            permisos: {
              create: basePermisos
            }
          }
        });
      }
    }
    console.log(`Tipos de documento por defecto generados para la empresa en ${tenantDbUrl}`);
  } catch (error) {
    console.error('Error sembrando Tipos de Documento:', error);
    throw error;
  } finally {
    await pTenant.$disconnect();
  }
}
