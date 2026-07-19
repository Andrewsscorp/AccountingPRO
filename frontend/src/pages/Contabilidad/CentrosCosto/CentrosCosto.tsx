import React, { useState, useEffect } from 'react';
import { 
  Box, Title, Text, Group, Button, TextInput, Table, ActionIcon, 
  Menu, Badge, Tabs, Paper, Stack, Alert 
} from '@mantine/core';
import { 
  IconPlus, IconSearch, IconEdit, IconTrash, IconDotsVertical, 
  IconFileExport, IconFileImport, IconList, IconHierarchy, IconSettings, IconAlertTriangle 
} from '@tabler/icons-react';
import CrearCentroCostoModal from '../../../components/contabilidad/CrearCentroCostoModal';
import EliminarCentroCostoModal from '../../../components/contabilidad/EliminarCentroCostoModal';
import ConfigurarEstructuraCCModal from '../../../components/contabilidad/ConfigurarEstructuraCCModal';
import TenantLayout from '../../../components/layout/TenantLayout';
import ErrorBoundary from '../../../components/ErrorBoundary';

export interface CentroCosto {
  id: number;
  codigo: string;
  nombre: string;
  nivel: number;
  padreId: number | null;
  padre?: { codigo: string; nombre: string };
  descripcion: string;
  activo: boolean;
  _count: { movimientos: number; hijos?: number };
}

export default function CentrosCosto() {
  const tenantId = localStorage.getItem('activeTenantId') || 'EMP000001';
  const [centros, setCentros] = useState<CentroCosto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modales
  const [isCrearModalOpen, setIsCrearModalOpen] = useState(false);
  const [isModificarModalOpen, setIsModificarModalOpen] = useState(false);
  const [isEliminarModalOpen, setIsEliminarModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hasConfig, setHasConfig] = useState(false);

  const fetchCentros = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/centros-costo/${tenantId}/centros-costo`);
      const data = await res.json();
      if (data.success) {
        setCentros(data.data);
      }
      
      const configRes = await fetch(`http://localhost:3000/api/centros-costo/${tenantId}/centros-costo/estructura`);
      const configData = await configRes.json();
      if (configData.success) {
        // Assume configuration exists if the API returns success with a valid id (or just check if it's set)
        setHasConfig(configData.data.id !== 0);
      }
    } catch (error) {
      console.error('Error fetching centros de costo:', error);
    }
  };

  useEffect(() => {
    if (tenantId) fetchCentros();
  }, [tenantId]);

  const filteredCentros = centros.filter(c => {
    const term = searchTerm.toLowerCase();
    return c.codigo.toLowerCase().includes(term) || c.nombre.toLowerCase().includes(term);
  });

  const totales = centros.length;
  const activos = centros.filter(c => c.activo && (!c._count || c._count.hijos === 0)).length;
  const inactivos = totales - activos;

  return (
    <TenantLayout>
      <ErrorBoundary>
      <Box p="md">
        <Group justify="space-between" align="flex-start" mb="xl">
          <div>
            <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconHierarchy size={28} /> Centros de Costos
            </Title>
            <Text c="dimmed" size="sm">Administra la estructura de centros de costos de la empresa.</Text>
          </div>
          <Group>
            <Button variant="default" leftSection={<IconSettings size={16} />} onClick={() => setIsConfigModalOpen(true)}>
              Configurar Estructura
            </Button>
            <Button variant="default" leftSection={<IconFileImport size={16} />}>Importar</Button>
            <Button variant="default" leftSection={<IconFileExport size={16} />}>Exportar</Button>
            <Button color="violet" leftSection={<IconPlus size={16} />} onClick={() => setIsCrearModalOpen(true)} disabled={!hasConfig}>
              Nuevo
            </Button>
          </Group>
        </Group>

        <Group mb="md" gap="lg">
          <Badge size="lg" variant="dot" color="violet">Total: {totales}</Badge>
          <Badge size="lg" variant="dot" color="green">Activos: {activos}</Badge>
          <Badge size="lg" variant="dot" color="red">Inactivos: {inactivos}</Badge>
        </Group>

        {!hasConfig && (
          <Alert icon={<IconAlertTriangle size={16} />} title="Atención" color="yellow" mb="md" variant="light">
            Debe configurar la estructura jerárquica de los Centros de Costos antes de poder crear uno nuevo.
          </Alert>
        )}

        <Tabs defaultValue="grid" color="violet">
          <Tabs.List mb="md">
            <Tabs.Tab value="grid" leftSection={<IconList size={16} />}>Vista Detallada</Tabs.Tab>
            <Tabs.Tab value="tree" leftSection={<IconHierarchy size={16} />}>Estructura (Árbol)</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="grid">
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between" mb="md">
                <TextInput
                  placeholder="Buscar por código o nombre..."
                  leftSection={<IconSearch size={16} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.currentTarget.value)}
                  style={{ width: 300 }}
                />
              </Group>

              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>CÓDIGO</Table.Th>
                    <Table.Th>NOMBRE</Table.Th>
                    <Table.Th>NIVEL</Table.Th>
                    <Table.Th>PADRE</Table.Th>
                    <Table.Th>ESTADO</Table.Th>
                    <Table.Th>MOVIMIENTOS</Table.Th>
                    <Table.Th style={{ width: 80 }}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredCentros.map((c) => (
                    <Table.Tr key={c.id}>
                      <Table.Td><Text fw={500}>{c.codigo}</Text></Table.Td>
                      <Table.Td>{c.nombre}</Table.Td>
                      <Table.Td>{c.nivel}</Table.Td>
                      <Table.Td>{c.padre ? `${c.padre.codigo} - ${c.padre.nombre}` : '-'}</Table.Td>
                      <Table.Td>
                        {(c.activo && (!c._count || c._count.hijos === 0))
                          ? <Badge size="xs" color="green" variant="dot">ACTIVO</Badge> 
                          : <Badge size="xs" color="red" variant="filled">{(c._count && c._count.hijos && c._count.hijos > 0) ? 'MAYOR (INACTIVO)' : 'INACTIVO'}</Badge>}
                      </Table.Td>
                      <Table.Td>{c._count?.movimientos || 0}</Table.Td>
                      <Table.Td>
                        <Menu position="bottom-end" shadow="sm">
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => { setSelectedId(c.id); setIsModificarModalOpen(true); }}>
                              Modificar
                            </Menu.Item>
                            <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => { setSelectedId(c.id); setIsEliminarModalOpen(true); }}>
                              Eliminar / Desactivar
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {filteredCentros.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={7} ta="center" py="xl">
                        <Text c="dimmed">No se encontraron centros de costos.</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="tree">
            <Paper withBorder p="xl" radius="md">
              <Stack align="center" gap="md">
                <IconHierarchy size={48} color="lightgray" />
                <Text c="dimmed" fs="italic">Visualización en desarrollo.</Text>
              </Stack>
            </Paper>
          </Tabs.Panel>
        </Tabs>

        <ConfigurarEstructuraCCModal
          opened={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          tenantId={tenantId}
          onSuccess={fetchCentros}
          hasConfig={hasConfig}
        />

        <CrearCentroCostoModal
          opened={isCrearModalOpen}
          onClose={() => setIsCrearModalOpen(false)}
          onSuccess={fetchCentros}
          centros={centros}
        />

        {selectedId && (
          <>
            <CrearCentroCostoModal
              opened={isModificarModalOpen}
              onClose={() => { setIsModificarModalOpen(false); setSelectedId(null); }}
              onSuccess={fetchCentros}
              centroId={selectedId}
              centros={centros}
            />

            <EliminarCentroCostoModal
              opened={isEliminarModalOpen}
              onClose={() => { setIsEliminarModalOpen(false); setSelectedId(null); }}
              onSuccess={fetchCentros}
              centroId={selectedId}
              codigo={centros.find(c => c.id === selectedId)?.codigo || ''}
              nombre={centros.find(c => c.id === selectedId)?.nombre || ''}
            />
          </>
        )}
      </Box>
      </ErrorBoundary>
    </TenantLayout>
  );
}
