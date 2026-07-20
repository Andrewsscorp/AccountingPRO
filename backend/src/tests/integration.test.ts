import request from 'supertest';
import express from 'express';
import contabilidadRoutes from '../routes/contabilidad.routes';
import jwt from 'jsonwebtoken';
import { PrismaClient as PrismaGlobal } from '@prisma/client-global';
import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';

const app = express();
app.use(express.json());
app.use('/api/contabilidad', contabilidadRoutes);

const prismaGlobal = new PrismaGlobal();
let token = '';

beforeAll(async () => {
    const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

    // Ensure EMP000001 exists
    const empresa = await prismaGlobal.empresaGlobal.upsert({
        where: { codigo_empresa: 'EMP000001' },
        update: {},
        create: {
            codigo_empresa: 'EMP000001',
            nombre_empresa: 'Test Company',
            nit: '123456789',
            servidor_bd: 'localhost',
            nombre_bd: 'EMP000001',
            estado: 'ACTIVO'
        }
    });

    // Create dummy user and map it if not mapped
    const user = await prismaGlobal.usuario.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            email: 'test@example.com',
            passwordHash: 'dummy',
            nombre: 'Test User',
        }
    });

    await prismaGlobal.usuarioEmpresa.upsert({
        where: {
            usuarioId_empresaId: {
                usuarioId: user.id,
                empresaId: empresa.id
            }
        },
        update: {},
        create: {
            usuarioId: user.id,
            empresaId: empresa.id
        }
    });

    token = jwt.sign(
        { userId: user.id, empresas: [empresa.id] },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
});

afterAll(async () => {
    await prismaGlobal.$disconnect();
});

describe('Integration Test: contabilidad routes with resolveTenant', () => {
    it('should return 401 when accessing without token', async () => {
        const res = await request(app).get('/api/contabilidad/EMP000001/plan-cuentas');
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Autenticación requerida');
    });

    it('should return 200 when accessing with valid token and tenant access', async () => {
        const res = await request(app)
            .get('/api/contabilidad/EMP000001/plan-cuentas')
            .set('Authorization', `Bearer ${token}`)
            .set('x-tenant-id', 'EMP000001');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});
