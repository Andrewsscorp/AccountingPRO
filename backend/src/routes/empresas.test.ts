import { afterAll, describe, it, expect } from '@jest/globals';
import app from '../app';
import { disconnectEmpresasPrisma } from './empresas.routes';

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

      const res = await fetch(`http://127.0.0.1:${address.port}/api/empresas`);
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
