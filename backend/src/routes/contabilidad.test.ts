import request from 'supertest';
import express from 'express';
import contabilidadRoutes from './contabilidad.routes';

// Setting up global mock for getTenantPrisma
const mockCount = jest.fn();
const mockDelete = jest.fn();
const mockFindUnique = jest.fn();
const mockCreate = jest.fn();

jest.mock('@prisma/client-global', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    empresaGlobal: { findFirst: jest.fn().mockResolvedValue({ id: 1, codigo_empresa: 'EMP001', nombre_bd: 'test_db' }) }
  }))
}));

jest.mock('@prisma/client-tenant', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
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
  }))
}));

const app = express();
app.use(express.json());
// Injecting x-tenant-id bypass for now as we mock Prisma entirely
app.use('/api/contabilidad', (req, res, next) => {
  // Mocking the getTenantPrisma inside the route since we mocked PrismaClient.
  next();
}, contabilidadRoutes);

describe('Contabilidad Routes - DELETE /:tenantId/plan-cuentas/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    mockFindUnique.mockResolvedValue({
      id: 1, codigo: '110505', nombre: 'Caja', activa: true, esSistema: false
    });
    // mockCount is used for both hijas (planCuenta.count) and movimientos (movimiento.count)
    mockCount.mockResolvedValue(0);
    mockDelete.mockResolvedValue({});
    mockCreate.mockResolvedValue({});
  });

  it('should reject deletion if account does not exist', async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    const res = await request(app).delete('/api/contabilidad/EMP001/plan-cuentas/999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should reject deletion if account has child accounts', async () => {
    // First call to count is for hijas, return 1
    mockCount.mockResolvedValueOnce(1);
    const res = await request(app).delete('/api/contabilidad/EMP001/plan-cuentas/1');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('requisitos');
  });

  it('should reject deletion if account has movements', async () => {
    // First call is for hijas (0), second is for movimientos (1)
    mockCount.mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    const res = await request(app).delete('/api/contabilidad/EMP001/plan-cuentas/1');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should delete account if no movements and no children', async () => {
    mockCount.mockResolvedValue(0);
    const res = await request(app).delete('/api/contabilidad/EMP001/plan-cuentas/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
