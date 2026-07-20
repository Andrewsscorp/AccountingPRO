// @ts-nocheck
import { ImportacionService } from '../importaciones.service';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

// This is a minimal unit test file mocking dependencies to test core logic
// For this we will mostly test parsing behavior, mapping logic that normally happens in ImportacionService

jest.mock('exceljs');

const mockFindUnique = jest.fn();
const tenantPrismaMock = {
  importacionJob: {
    findUnique: mockFindUnique,
  }
};

describe('ImportacionesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debería rechazar si la importación no existe', async () => {
    mockFindUnique.mockReturnValue(Promise.resolve(null);
    await expect(ImportacionService.confirmarImportacion(tenantPrismaMock, 1, {}, {}, 'user1')).rejects.toThrow('Importación no encontrada');
  });

  it('Debería rechazar si la importación ya fue procesada', async () => {
    mockFindUnique.mockReturnValue(Promise.resolve({ id: 1, estado: 'FINALIZADA' });
    await expect(ImportacionService.confirmarImportacion(tenantPrismaMock, 1, {}, {}, 'user1')).rejects.toThrow('Esta importación ya fue procesada');
  });
});
