import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import CentrosCosto from '../pages/Contabilidad/CentrosCosto/CentrosCosto';

globalThis.fetch = vi.fn(() => Promise.resolve({
  json: () => Promise.resolve({ success: true, data: [] })
})) as any;

describe('CentrosCosto', () => {
  it('renders without crashing', () => {
    render(
      <MantineProvider>
        <MemoryRouter>
          <CentrosCosto />
        </MemoryRouter>
      </MantineProvider>
    );
  });
});
