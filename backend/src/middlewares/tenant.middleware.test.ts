// @ts-nocheck
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
      status: jest.fn().mockReturnThis() as any as any,
      json: jest.fn() as any,
      on: jest.fn() as any,
    };
    jest.clearAllMocks();
  });

  it('should return 401 if no auth header provided', async () => {
    await resolveTenant(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect((mockResponse.json as any)).toHaveBeenCalledWith({ success: false, message: 'Autenticación requerida' });
  });

  it('should return 401 if token is invalid', async () => {
    mockRequest.headers = { authorization: 'Bearer invalid_token' };
    (jwt.verify as any).mockImplementation(() => { throw new Error('invalid token'); });

    await resolveTenant(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect((mockResponse.json as any)).toHaveBeenCalledWith({ success: false, message: 'Token inválido o expirado' });
  });

  it('should call next if tenantId is missing but route doesn\'t strictly require it here', async () => {
    mockRequest.headers = { authorization: 'Bearer valid_token' };
    (jwt.verify as any).mockReturnValue({ userId: 1 });

    await resolveTenant(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should return 403 if user does not have access', async () => {
    mockRequest.headers = { authorization: 'Bearer valid_token', 'x-tenant-id': 'EMP001' };
    (jwt.verify as any).mockReturnValue({ userId: 1 });
    mockFindFirst.mockReturnValue(Promise.resolve({ id: 1, codigo_empresa: 'EMP001', nombre_bd: 'db1' } as never);
    mockFindUnique.mockReturnValue(Promise.resolve(null as never); // No access

    await resolveTenant(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect((mockResponse.json as any)).toHaveBeenCalledWith({ success: false, message: 'No tiene permiso para acceder a esta empresa' });
  });

  it('should call next if user has access', async () => {
    mockRequest.headers = { authorization: 'Bearer valid_token', 'x-tenant-id': 'EMP001' };
    (jwt.verify as any).mockReturnValue({ userId: 1 });
    mockFindFirst.mockReturnValue(Promise.resolve({ id: 1, codigo_empresa: 'EMP001', nombre_bd: 'db1' } as never);
    mockFindUnique.mockReturnValue(Promise.resolve({ usuarioId: 1, empresaId: 1 } as never); // Has access

    await resolveTenant(mockRequest as Request, mockResponse as Response, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });
});
