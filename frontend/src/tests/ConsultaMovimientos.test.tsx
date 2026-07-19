import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import ConsultaMovimientos from '../pages/Contabilidad/Movimientos/ConsultaMovimientos';

// Mock de fetch para interceptar las llamadas al API sin depender del backend real
global.fetch = vi.fn((url) => {
  if (url.toString().includes('search')) {
    return Promise.resolve({
      json: () => Promise.resolve({
        success: true,
        data: [],
        total: 0,
        totalDebitos: 0,
        totalCreditos: 0,
        diferencia: 0
      })
    });
  }
  return Promise.resolve({
    json: () => Promise.resolve({ success: true, data: [] })
  });
}) as any;

describe('ConsultaMovimientos', () => {
  it('renderiza la vista principal sin errores (no se queda en blanco)', async () => {
    render(
      <MantineProvider>
        <MemoryRouter>
          <ConsultaMovimientos />
        </MemoryRouter>
      </MantineProvider>
    );

    // Verificamos que el título se dibuja correctamente en pantalla
    expect(screen.getByText('Consulta de Movimientos')).toBeInTheDocument();
  });

  it('renderiza los filtros iniciales de Documento', async () => {
    render(
      <MantineProvider>
        <MemoryRouter>
          <ConsultaMovimientos />
        </MemoryRouter>
      </MantineProvider>
    );

    // Debe mostrar la etiqueta del filtro de Documento
    await waitFor(() => {
      expect(screen.getByLabelText('Número de Documento')).toBeInTheDocument();
    });
  });

  it('renderiza las tarjetas de indicadores financieros', () => {
    render(
      <MantineProvider>
        <MemoryRouter>
          <ConsultaMovimientos />
        </MemoryRouter>
      </MantineProvider>
    );

    // Aseguramos que las cajas de sumatorias (Total Débitos, etc) existan
    expect(screen.getByText('Total Débitos')).toBeInTheDocument();
    expect(screen.getByText('Total Créditos')).toBeInTheDocument();
    expect(screen.getByText('Diferencia')).toBeInTheDocument();
  });

  it('no explota si la API devuelve datos vacíos (Manejo de estados vacíos)', async () => {
    render(
      <MantineProvider>
        <MemoryRouter>
          <ConsultaMovimientos />
        </MemoryRouter>
      </MantineProvider>
    );

    // Verificamos el mensaje en la tabla que se debe mostrar cuando no hay datos
    await waitFor(() => {
      expect(screen.getByText('No se encontraron movimientos para los filtros seleccionados.')).toBeInTheDocument();
    });
  });
});
