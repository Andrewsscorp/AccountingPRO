const mockFindUnique = jest.fn();

jest.mock('@prisma/client-global', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        usuario: {
          findUnique: mockFindUnique,
        }
      };
    }),
  };
});

import request from 'supertest';
import express from 'express';
import bcrypt from 'bcrypt';
import authRoutes from './auth.routes';

// Mock express app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if credentials are missing', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 if user not found', async () => {
      mockFindUnique.mockResolvedValue(null);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 if password does not match', async () => {
      const hash = await bcrypt.hash('password123', 10);
      mockFindUnique.mockResolvedValue({
        id: 1, email: 'test@test.com', passwordHash: hash, activo: true, empresas: []
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return token on successful login', async () => {
      const hash = await bcrypt.hash('password123', 10);
      mockFindUnique.mockResolvedValue({
        id: 1, email: 'test@test.com', passwordHash: hash, activo: true, empresas: [{ empresaId: 1 }]
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return 401 if no refresh token provided', async () => {
      const res = await request(app).post('/api/auth/refresh').send({});
      expect(res.status).toBe(401);
    });

    it('should return 403 on invalid token', async () => {
      const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'invalid' });
      expect(res.status).toBe(403);
    });
  });
});
