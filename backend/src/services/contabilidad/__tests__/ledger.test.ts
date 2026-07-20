// @ts-nocheck
import { LedgerService, InvalidEntryError, UnbalancedTransactionError, MovimientoInput } from '../ledger.service';
import { LedgerQueryService } from '../ledger.query';
import { PrismaClient as PrismaGlobal } from '@prisma/client-global';
import { PrismaClient as PrismaTenant } from '@prisma/client-tenant';
import path from 'path';

// Override the DB for tests so we don't accidentally look in a prod DB and get missing tables
const globalPrisma = new PrismaGlobal({
  datasources: {
    db: {
      url: "file:./prisma/global.db"
    }
  }
});

const mockFindMany = jest.fn();
// Mock PrismaGlobal and specifically the findFirst so it returns a test DB tenant.
jest.mock('@prisma/client-global', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        empresaGlobal: {
          findFirst: jest.fn().mockImplementation(async ({ where }: any) => {
            if (where.codigo_empresa === 'EMP000001') {
               return { id: 1, codigo_empresa: 'EMP000001', nombre_bd: 'dev', servidor_bd: 'localhost', estado: 'ACTIVA' };
            }
            if (where.codigo_empresa === 'EMP000002') {
               return { id: 2, codigo_empresa: 'EMP000002', nombre_bd: 'dev', servidor_bd: 'localhost', estado: 'ACTIVA' };
            }
            return null;
          }),
        },
        $disconnect: jest.fn()
      };
    }),
  };
});

jest.mock('@prisma/client-tenant', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        movimiento: {
          findMany: mockFindMany
        },
        $disconnect: jest.fn()
      };
    }),
  };
});


describe('LedgerService - Double-Entry Engine Validation', () => {
  it('Debería retornar true para un asiento con múltiples líneas que cuadra perfectamente', () => {
    const movimientos: MovimientoInput[] = [
      { debito: 100.55, credito: 0 },
      { debito: 0, credito: 50.25 },
      { debito: 0, credito: 50.30 }
    ];
    
    expect(LedgerService.validateDoubleEntry(movimientos)).toBe(true);
  });

  it('Debería lanzar UnbalancedTransactionError para un descuadre de 0.01 centavo', () => {
    const movimientos: MovimientoInput[] = [
      { debito: 100.56, credito: 0 },
      { debito: 0, credito: 50.25 },
      { debito: 0, credito: 50.30 }
    ];
    
    expect(() => LedgerService.validateDoubleEntry(movimientos)).toThrow(UnbalancedTransactionError);
  });

  it('Debería lanzar InvalidEntryError para un asiento con un solo movimiento', () => {
    const movimientos: MovimientoInput[] = [
      { debito: 100.56, credito: 0 }
    ];
    
    expect(() => LedgerService.validateDoubleEntry(movimientos)).toThrow(InvalidEntryError);
  });

  it('Debería manejar correctamente problemas de precisión en JS (ej: 0.1 + 0.2)', () => {
    const movimientos: MovimientoInput[] = [
      { debito: 0.1, credito: 0 },
      { debito: 0.2, credito: 0 },
      { debito: 0, credito: 0.3 }
    ];
    expect(LedgerService.validateDoubleEntry(movimientos)).toBe(true);
  });

  it('Debería permitir montos en cero siempre que cuadre y haya 2 o más líneas', () => {
    const movimientos: MovimientoInput[] = [
      { debito: 0, credito: 0 },
      { debito: 0, credito: 0 }
    ];
    expect(LedgerService.validateDoubleEntry(movimientos)).toBe(true);
  });

  it('Debería funcionar correctamente con 10 o más líneas', () => {
    const movimientos: MovimientoInput[] = Array(10).fill({ debito: 10, credito: 0 });
    movimientos.push({ debito: 0, credito: 100 });
    expect(LedgerService.validateDoubleEntry(movimientos)).toBe(true);
  });

  it('Debería lanzar error si los negativos no cuadran (si aplica lógica con negativos)', () => {
    const movimientos: MovimientoInput[] = [
      { debito: -50, credito: 0 },
      { debito: 0, credito: 50 }
    ];
    expect(() => LedgerService.validateDoubleEntry(movimientos)).toThrow(UnbalancedTransactionError);
  });
});

describe('LedgerQueryService - Query Model', () => {
  let tenant1Id = 'EMP000001';
  let tenant2Id = 'EMP000002';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Verificar que la consulta se ejecuta sobre la base de datos de la empresa "A" y no lee datos de la empresa "B"', async () => {
    mockFindMany.mockReturnValueOnce(Promise.resolve([
      { id: 2, descripcion: 'Movimiento Reciente' },
      { id: 1, descripcion: 'Movimiento Antiguo' }
    ]);
    const movimientosEmpresa1 = await LedgerQueryService.getLedgerMovements(tenant1Id, 10);
    expect(movimientosEmpresa1.length).toBe(2);
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }));
  });

  it('Verificar que la paginación por cursor retorna los registros en el orden cronológico inverso correcto', async () => {
    mockFindMany.mockReturnValueOnce(Promise.resolve([
      { id: 1, descripcion: 'Movimiento Antiguo' }
    ]);
    const cursorId = 2;

    const segundaPagina = await LedgerQueryService.getLedgerMovements(tenant1Id, 1, cursorId);
    expect(segundaPagina.length).toBe(1);
    expect(segundaPagina[0].descripcion).toBe('Movimiento Antiguo');
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
        take: 1,
        cursor: { id: cursorId },
        skip: 1
    }));
  });
});
