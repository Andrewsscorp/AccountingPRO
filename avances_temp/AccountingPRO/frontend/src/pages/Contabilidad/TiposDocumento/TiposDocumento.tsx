import { useState, useEffect } from 'react';
import { Box, Title, Text, Group, Button, Breadcrumbs, Anchor, Table, Badge, TextInput, Loader, Center, ScrollArea, Pagination, Select, ActionIcon, Menu } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconSearch, IconDotsVertical, IconFileInvoice } from '@tabler/icons-react';
import TenantLayout from '../../../components/layout/TenantLayout';
import { useNavigate } from 'react-router-dom';
import CrearTipoDocumentoModal from '../../../components/contabilidad/CrearTipoDocumentoModal';
import EliminarTipoDocumentoModal from '../../../components/contabilidad/EliminarTipoDocumentoModal';

interface TipoDocumento {
  id: number;
  codigo: string;
  nombre: string;
  modulo: string;
  clase: string;
  esSistema: boolean;
  activo: boolean;
  numeraciones: any[];
}

export default function TiposDocumento() {
  const navigate = useNavigate();
  const [tipos, setTipos] = useState<TipoDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('20');
  
  const [crearModalOpen, setCrearModalOpen] = useState(false);
  const [modificarModalOpen, setModificarModalOpen] = useState(false);
  const [eliminarModalOpen, setEliminarModalOpen] = useState(false);
  const [selectedTipoId, setSelectedTipoId] = useState<number | null>(null);

  const tenantId = localStorage.getItem('activeTenantId') || 'EMP000001';

  useEffect(() => {
    fetchTipos();
  }, []);

  const fetchTipos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3000/api/tipos-documento/${tenantId}/tipos-documento`);
      const json = await res.json();
      if (json.success) {
        setTipos(json.data);
      }
    } catch (error) {
      console.error('Error cargando tipos de documento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id: number) => {
    setSelectedTipoId(id);
    setEliminarModalOpen(true);
  };

  const filteredTipos = tipos.filter(t => {
    const s = search.toLowerCase();
    return t.codigo.toLowerCase().includes(s) || t.nombre.toLowerCase().includes(s) || t.modulo.toLowerCase().includes(s);
  });

  const items = [
    { title: 'Contabilidad', href: '/contabilidad' },
    { title: 'Tipos de Documento', href: '#' },
  ].map((item, index) => (
    <Anchor key={index} href={item.href} size="sm" color={index === 1 ? 'violet' : 'dimmed'} fw={index === 1 ? 600 : 400}>
      {item.title}
    </Anchor>
  ));

  return (
    <TenantLayout>
      <Box p="md">
        <Breadcrumbs mb="xs" separator=">">{items}</Breadcrumbs>
        <Group justify="space-between" align="flex-end" mb="xl">
          <Box>
            <Title order={2} style={{ color: '#2C2E33', fontWeight: 700 }}>Tipos de Documento</Title>
            <Text c="dimmed" size="sm" mt={2}>
              Administre los comprobantes, facturas y notas del sistema.
            </Text>
          </Box>
        </Group>

        <Group justify="space-between" mb="md">
          <TextInput
            placeholder="Buscar documento..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ width: 300 }}
          />
          <Group gap="sm">
            <Button color="violet" radius="md" leftSection={<IconPlus size={16} />} onClick={() => { setSelectedTipoId(null); setCrearModalOpen(true); }}>
              Nuevo
            </Button>
            <Button variant="default" radius="md" leftSection={<IconEdit size={16} />} onClick={() => {
              if (!selectedTipoId) alert('Seleccione un documento primero');
              else setModificarModalOpen(true);
            }}>Modificar</Button>
            <Button variant="default" radius="md" color="red" leftSection={<IconTrash size={16} color="red" />} onClick={() => {
              if (!selectedTipoId) alert('Seleccione un documento primero');
              else handleEliminar(selectedTipoId);
            }}>Eliminar</Button>
          </Group>
        </Group>

        <Box bg="white" style={{ borderRadius: 8, border: '1px solid #e9ecef', overflow: 'hidden' }}>
          <ScrollArea h={500}>
            {loading ? (
              <Center h={400}><Loader color="violet" /></Center>
            ) : (
              <Table verticalSpacing="sm" horizontalSpacing="md" striped highlightOnHover>
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th><Text size="xs" fw={700} c="dimmed">CÓDIGO</Text></Table.Th>
                    <Table.Th><Text size="xs" fw={700} c="dimmed">NOMBRE</Text></Table.Th>
                    <Table.Th><Text size="xs" fw={700} c="dimmed">MÓDULO</Text></Table.Th>
                    <Table.Th><Text size="xs" fw={700} c="dimmed">SISTEMA</Text></Table.Th>
                    <Table.Th><Text size="xs" fw={700} c="dimmed">ESTADO</Text></Table.Th>
                    <Table.Th><Text size="xs" fw={700} c="dimmed">CONSECUTIVO</Text></Table.Th>
                    <Table.Th style={{ width: 40 }}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredTipos.length > 0 ? filteredTipos.map(t => (
                    <Table.Tr 
                      key={t.id}
                      onClick={() => setSelectedTipoId(t.id)}
                      bg={selectedTipoId === t.id ? 'violet.0' : undefined}
                      style={{ cursor: 'pointer' }}
                    >
                      <Table.Td>
                        <Text size="sm" fw={600}>{t.codigo}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{t.nombre}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant="light" color="blue">{t.modulo}</Badge>
                      </Table.Td>
                      <Table.Td>
                        {t.esSistema ? <Badge size="xs" color="gray" variant="filled">SISTEMA</Badge> : <Badge size="xs" color="blue" variant="light">USUARIO</Badge>}
                      </Table.Td>
                      <Table.Td>
                        {t.activo ? <Badge size="xs" color="green" variant="dot">ACTIVO</Badge> : <Badge size="xs" color="red" variant="filled">INACTIVO</Badge>}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{t.numeraciones[0]?.consecutivoActual || 0}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Menu shadow="md" width={150}>
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => {
                              setSelectedTipoId(t.id);
                              setModificarModalOpen(true);
                            }}>Editar</Menu.Item>
                            <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => {
                              handleEliminar(t.id);
                            }}>Eliminar</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  )) : (
                    <Table.Tr>
                      <Table.Td colSpan={6}>
                        <Center py="xl"><Text c="dimmed">No se encontraron documentos</Text></Center>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            )}
          </ScrollArea>
          <Box p="md" style={{ borderTop: '1px solid #e9ecef' }}>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Mostrando 1 a {filteredTipos.length} de {filteredTipos.length} documentos</Text>
              <Group gap="xs">
                <Pagination total={1} color="violet" size="sm" />
                <Select
                  size="sm"
                  data={['10', '20', '50', '100']}
                  value={pageSize}
                  onChange={(v) => setPageSize(v || '20')}
                  style={{ width: 80 }}
                />
                <Text size="sm" c="dimmed">por página</Text>
              </Group>
            </Group>
          </Box>
        </Box>

        <CrearTipoDocumentoModal 
          opened={crearModalOpen} 
          onClose={() => setCrearModalOpen(false)}
          tenantId={tenantId}
          onSuccess={fetchTipos} 
          tipoId={null} 
        />

        {selectedTipoId && modificarModalOpen && (
          <CrearTipoDocumentoModal 
            opened={modificarModalOpen} 
            onClose={() => setModificarModalOpen(false)}
            tenantId={tenantId}
            onSuccess={fetchTipos} 
            tipoId={selectedTipoId} 
          />
        )}

        {selectedTipoId && eliminarModalOpen && (
          <EliminarTipoDocumentoModal
            opened={eliminarModalOpen}
            onClose={() => setEliminarModalOpen(false)}
            onSuccess={fetchTipos}
            tipoId={selectedTipoId}
            codigo={tipos.find(t => t.id === selectedTipoId)?.codigo || ''}
            nombre={tipos.find(t => t.id === selectedTipoId)?.nombre || ''}
            modulo={tipos.find(t => t.id === selectedTipoId)?.modulo || ''}
            clase={tipos.find(t => t.id === selectedTipoId)?.clase || ''}
          />
        )}
      </Box>
    </TenantLayout>
  );
}
