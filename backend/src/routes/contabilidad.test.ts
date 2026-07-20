// @ts-nocheck
import request from 'supertest';
import express from 'express';
import contabilidadRoutes from './contabilidad.routes';

const mockCount = jest.fn();
const mockDelete = jest.fn();
const mockFindUnique = jest.fn();
const mockCreate = jest.fn();

jest.mock('@prisma/client-global', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    empresaGlobal: { findFirst: jest.fn().mockResolvedValue({ id: 1, codigo_empresa: 'EMP001', nombre_bd: 'test_db' } as any) }
  }))
}));

const mockTenantPrisma = {
    planCuenta: {
      findUnique: mockFindUnique,
      count: mockCount,
      delete: mockDelete
    },
    movimiento: {
      count: mockCount
    },
    auditoriaCuenta: {
      create: mockCreate
    },
    $disconnect: jest.fn()
};

jest.mock('@prisma/client-tenant', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockTenantPrisma)
}));

const app = express();
app.use(express.json());
app.use('/api/contabilidad', (req: any, res, next) => {
  req.tenantPrisma = mockTenantPrisma;
  next();
}, contabilidadRoutes);

describe('Contabilidad Routes - DELETE /:tenantId/plan-cuentas/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockFindUnique.mockResolvedValue({
      id: 1, codigo: '110505', nombre: 'Caja', activa: true, esSistema: false
    } as any);
    mockCount.mockResolvedValue(0 as any);
    mockDelete.mockResolvedValue({} as any);
    mockCreate.mockResolvedValue({} as any);
  });

  it('should reject deletion if account does not exist', async () => {
    mockFindUnique.mockResolvedValueOnce(null as any);
    const res = await request(app).delete('/api/contabilidad/EMP001/plan-cuentas/999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should reject deletion if account has child accounts', async () => {
    mockCount.mockResolvedValueOnce(1 as any);
    const res = await request(app).delete('/api/contabilidad/EMP001/plan-cuentas/1');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('requisitos');
  });

  it('should reject deletion if account has movements', async () => {
    mockCount.mockResolvedValueOnce(0 as any).mockResolvedValueOnce(1 as any);
    const res = await request(app).delete('/api/contabilidad/EMP001/plan-cuentas/1');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should delete account if no movements and no children', async () => {
    mockCount.mockResolvedValue(0 as any);
    const res = await request(app).delete('/api/contabilidad/EMP001/plan-cuentas/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
