import { afterAll, describe, it, expect } from '@jest/globals';
import app from '../app';
import { disconnectEmpresasPrisma } from './empresas.routes';

// Mocking Prisma so tests dont fail looking for actual DBs
jest.mock('@prisma/client-global', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        empresaGlobal: {
          findMany: jest.fn().mockResolvedValue([{ id: 1, codigo_empresa: 'EMP001', nombre_bd: 'test_db' }]),
        },
        $disconnect: jest.fn(),
      };
    }),
  };
});

jest.mock('@prisma/client-tenant', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        configuracionEmpresa: {
          findFirst: jest.fn().mockResolvedValue(null)
        },
        $disconnect: jest.fn(),
      };
    }),
  };
});

describe('Empresas API', () => {
  afterAll(async () => {
    await disconnectEmpresasPrisma();
  });

  it('should return a list of companies', async () => {
    const server = app.listen(0);

    try {
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('No se pudo iniciar el servidor de prueba');
      }

      // Add a dummy token since we secured the layout using fetch
      const res = await fetch(`http://127.0.0.1:${address.port}/api/empresas`, {
        headers: { 'Authorization': 'Bearer test' }
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBeTruthy();
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  }, 15000);
});
