import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const mockFindUnique = jest.fn();
const mockFindFirst = jest.fn();

jest.mock('@prisma/client-global', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        empresaGlobal: {
          findFirst: mockFindFirst,
        },
        usuarioEmpresa: {
          findUnique: mockFindUnique,
        }
      };
    }),
  };
});

jest.mock('@prisma/client-tenant', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        $disconnect: jest.fn(),
      };
    }),
  };
});

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

import { resolveTenant } from './tenant.middleware';

describe('tenant.middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {
      headers: {},
      params: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      on: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should return 401 if no auth header provided', async () => {
    await resolveTenant(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ success: false, message: 'Autenticación requerida' });
  });

  it('should return 401 if token is invalid', async () => {
    mockRequest.headers = { authorization: 'Bearer invalid_token' };
    (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid token'); });

    await resolveTenant(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ success: false, message: 'Token inválido o expirado' });
  });

  it('should return 400 if tenantId is missing', async () => {
    mockRequest.headers = { authorization: 'Bearer valid_token' };
    (jwt.verify as jest.Mock).mockReturnValue({ userId: 1 });

    await resolveTenant(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ success: false, message: 'Falta identificador de empresa (x-tenant-id)' });
  });

  it('should return 403 if user does not have access', async () => {
    mockRequest.headers = { authorization: 'Bearer valid_token', 'x-tenant-id': 'EMP001' };
    (jwt.verify as jest.Mock).mockReturnValue({ userId: 1 });
    mockFindFirst.mockResolvedValue({ id: 1, codigo_empresa: 'EMP001', nombre_bd: 'db1' });
    mockFindUnique.mockResolvedValue(null); // No access

    await resolveTenant(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({ success: false, message: 'No tiene permiso para acceder a esta empresa' });
  });

  it('should call next if user has access', async () => {
    mockRequest.headers = { authorization: 'Bearer valid_token', 'x-tenant-id': 'EMP001' };
    (jwt.verify as jest.Mock).mockReturnValue({ userId: 1 });
    mockFindFirst.mockResolvedValue({ id: 1, codigo_empresa: 'EMP001', nombre_bd: 'db1' });
    mockFindUnique.mockResolvedValue({ usuarioId: 1, empresaId: 1 }); // Has access

    await resolveTenant(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });
});
