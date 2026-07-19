import { useState, useEffect } from 'react';
import {
  Box,
  Title,
  Text,
  Group,
  Button,
  Breadcrumbs,
  Anchor,
  Table,
  Badge,
  TextInput,
  Loader,
  Center,
  ScrollArea,
  Pagination,
  Select,
  ActionIcon,
  Menu
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconFileImport,
  IconFileExport,
  IconSearch,
  IconDotsVertical,
  IconBuildingStore,
  IconUser
} from '@tabler/icons-react';
import TenantLayout from '../../components/layout/TenantLayout';
import { useNavigate } from 'react-router-dom';
import CrearTerceroModal from '../../components/terceros/CrearTerceroModal';
import ModificarTerceroModal from '../../components/terceros/ModificarTerceroModal';
import EliminarTerceroModal from '../../components/terceros/EliminarTerceroModal';

interface Tercero {
  id: number;
  tipoIdentificacion: string;
  identificacion: string;
  razonSocial: string | null;
  nombre1: string | null;
  apellido1: string | null;
  ciudad: string | null;
  telefono: string | null;
  email: string | null;
  tipoPersona: string;
  activa: boolean;
  esEmpresaPrincipal: boolean;
  roles: { rol: string }[];
}

export default function Terceros() {
  const navigate = useNavigate();
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('20');
  const [filtro, setFiltro] = useState('Todos');

  const [crearModalOpen, setCrearModalOpen] = useState(false);
  const [modificarModalOpen, setModificarModalOpen] = useState(false);
  const [eliminarModalOpen, setEliminarModalOpen] = useState(false);
  const [selectedTerceroId, setSelectedTerceroId] = useState<number | null>(null);

  const tenantId = localStorage.getItem('activeTenantId') || 'EMP000001';

  useEffect(() => {
    fetchTerceros();
  }, []);

  const fetchTerceros = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3000/api/terceros/${tenantId}/terceros`);
      const json = await res.json();
      if (json.success) {
        setTerceros(json.data);
      }
    } catch (error) {
      console.error('Error cargando terceros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEstado = async (id: number, currentActiva: boolean) => {
    try {
      const res = await fetch(`http://localhost:3000/api/terceros/${tenantId}/terceros/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: !currentActiva })
      });
      const data = await res.json();
      if (data.success) {
        fetchTerceros();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error de conexión');
    }
  };

  const getNombre = (t: Tercero) => {
    if (t.tipoPersona === 'JURIDICA') return t.razonSocial || t.nombre1 || '';
    return `${t.nombre1 || ''} ${t.apellido1 || ''}`.trim() || t.razonSocial || '';
  };

  const filteredTerceros = terceros.filter(t => {
    const s = search.toLowerCase();
    const nombre = getNombre(t).toLowerCase();
    const matchesSearch = t.identificacion.includes(s) || nombre.includes(s) || (t.email || '').toLowerCase().includes(s);
    
    let matchesFilter = true;
    if (filtro === 'Todos') matchesFilter = t.activa === true;
    else if (filtro === 'Activos') matchesFilter = t.activa === true;
    else if (filtro === 'Inactivos') matchesFilter = t.activa === false;
    else if (filtro === 'Clientes') matchesFilter = t.activa === true && t.roles.some(r => r.rol === 'CLIENTE');
    else if (filtro === 'Proveedores') matchesFilter = t.activa === true && t.roles.some(r => r.rol === 'PROVEEDOR');
    else if (filtro === 'Empleados') matchesFilter = t.activa === true && t.roles.some(r => r.rol === 'EMPLEADO');
    else if (filtro === 'Otros') matchesFilter = t.activa === true && !t.roles.some(r => ['CLIENTE', 'PROVEEDOR', 'EMPLEADO'].includes(r.rol));

    return matchesSearch && matchesFilter;
  });

  const items = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Terceros', href: '#' },
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
            <Title order={2} style={{ color: '#2C2E33', fontWeight: 700 }}>Terceros</Title>
            <Text c="dimmed" size="sm" mt={2}>
              Administre la información de sus clientes, proveedores y demás terceros.
            </Text>
          </Box>
          <Group>
            <TextInput
              placeholder="Buscar tercero..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              style={{ width: 250 }}
            />
          </Group>
        </Group>

        <Group gap="sm" mb="md">
          {['Todos', 'Clientes', 'Proveedores', 'Empleados', 'Otros'].map(f => (
            <Button 
              key={f} 
              variant={filtro === f ? 'light' : 'default'} 
              color={filtro === f ? 'violet' : 'gray'}
              onClick={() => setFiltro(f)}
              radius="xl"
            >
              {f}
            </Button>
          ))}
          <Button variant={filtro === 'Activos' ? 'light' : 'default'} color={filtro === 'Activos' ? 'green' : 'gray'} radius="xl" onClick={() => setFiltro('Activos')}>
            <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: filtro === 'Activos' ? '#40c057' : '#ced4da', marginRight: 8 }} />
            Activos
          </Button>
          <Button variant={filtro === 'Inactivos' ? 'light' : 'default'} color={filtro === 'Inactivos' ? 'red' : 'gray'} radius="xl" onClick={() => setFiltro('Inactivos')}>
            <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: filtro === 'Inactivos' ? '#fa5252' : '#ced4da', marginRight: 8 }} />
            Inactivos
          </Button>
        </Group>

        <Group gap="sm" mb="md">
          <Button color="violet" radius="md" leftSection={<IconPlus size={16} />} onClick={() => setCrearModalOpen(true)}>+ Nuevo</Button>
          <Button variant="default" radius="md" leftSection={<IconEdit size={16} />} onClick={() => {
            if (!selectedTerceroId) alert('Seleccione un tercero de la tabla usando las opciones (...)');
            else setModificarModalOpen(true);
          }}>Modificar</Button>
          <Button variant="default" radius="md" color="red" leftSection={<IconTrash size={16} color="red" />} onClick={() => {
            if (!selectedTerceroId) alert('Seleccione un tercero de la tabla usando las opciones (...)');
            else setEliminarModalOpen(true);
          }}>Eliminar</Button>
          <Button variant="default" radius="md" leftSection={<IconFileImport size={16} />}>Importar</Button>
          <Button variant="default" radius="md" leftSection={<IconFileExport size={16} />}>Exportar</Button>
          <Button variant="default" radius="md" rightSection={<IconDotsVertical size={16} />}>Más opciones</Button>
        </Group>

        {/* Table Container */}
        <Box bg="white" style={{ borderRadius: 8, border: '1px solid #e9ecef', overflow: 'hidden' }}>
          <ScrollArea h={500}>
            {loading ? (
              <Center h={400}><Loader color="violet" /></Center>
            ) : (
              <Table verticalSpacing="sm" horizontalSpacing="md" striped highlightOnHover>
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    <Table.Th style={{ width: 60 }}><Text size="xs" fw={700} c="dimmed">TIPO</Text></Table.Th>
                    <Table.Th><Text size="xs" fw={700} c="dimmed">DOCUMENTO ↕</Text></Table.Th>
                    <Table.Th><Text size="xs" fw={700} c="dimmed">NOMBRE / RAZON SOCIAL ↕</Text></Table.Th>
                    <Table.Th><Text size="xs" fw={700} c="dimmed">CIUDAD ↕</Text></Table.Th>
                    <Table.Th><Text size="xs" fw={700} c="dimmed">TELÉFONO ↕</Text></Table.Th>
                    <Table.Th><Text size="xs" fw={700} c="dimmed">CORREO ELECTRÓNICO ↕</Text></Table.Th>
                    <Table.Th><Text size="xs" fw={700} c="dimmed">ESTADO ↕</Text></Table.Th>
                    <Table.Th style={{ width: 40 }}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredTerceros.length > 0 ? filteredTerceros.map(t => (
                    <Table.Tr 
                      key={t.id}
                      onClick={() => setSelectedTerceroId(t.id)}
                      bg={selectedTerceroId === t.id ? 'violet.0' : undefined}
                      style={{ cursor: 'pointer' }}
                    >
                      <Table.Td>
                        <Box bg="violet.0" p={6} style={{ borderRadius: 4, display: 'inline-flex' }}>
                          {t.tipoPersona === 'JURIDICA' ? <IconBuildingStore size={18} color="#7950f2" /> : <IconUser size={18} color="#7950f2" />}
                        </Box>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>{t.identificacion}</Text>
                        <Badge size="xs" variant="light" color="blue" mt={2}>{t.tipoIdentificacion}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={600} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {getNombre(t)}
                          {t.esEmpresaPrincipal && (
                            <Badge size="xs" variant="filled" color="violet">EMPRESA PRINCIPAL</Badge>
                          )}
                        </Text>
                      </Table.Td>
                      <Table.Td><Text size="sm">{t.ciudad || '-'}</Text></Table.Td>
                      <Table.Td><Text size="sm">{t.telefono || '-'}</Text></Table.Td>
                      <Table.Td><Text size="sm">{t.email || '-'}</Text></Table.Td>
                      <Table.Td>
                        <Badge color={t.activa ? 'green' : 'red'} variant="light">
                          {t.activa ? 'Activo' : 'Inactivo'}
                        </Badge>
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
                              setSelectedTerceroId(t.id);
                              setModificarModalOpen(true);
                            }}>Editar</Menu.Item>
                            <Menu.Item 
                              leftSection={t.activa ? <IconTrash size={14} /> : <IconPlus size={14} />} 
                              color={t.activa ? "orange" : "green"} 
                              onClick={() => {
                                handleToggleEstado(t.id, t.activa);
                              }}
                            >
                              {t.activa ? 'Inactivar' : 'Activar'}
                            </Menu.Item>
                            <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => {
                              setSelectedTerceroId(t.id);
                              setEliminarModalOpen(true);
                            }}>Eliminar</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  )) : (
                    <Table.Tr>
                      <Table.Td colSpan={8}>
                        <Center py="xl"><Text c="dimmed">No se encontraron terceros</Text></Center>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            )}
          </ScrollArea>
          
          <Box p="md" style={{ borderTop: '1px solid #e9ecef' }}>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Mostrando 1 a {filteredTerceros.length} de {filteredTerceros.length} terceros</Text>
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

        <CrearTerceroModal opened={crearModalOpen} onClose={() => setCrearModalOpen(false)} tenantId={tenantId} onSuccess={fetchTerceros} />
        <ModificarTerceroModal opened={modificarModalOpen} onClose={() => setModificarModalOpen(false)} tenantId={tenantId} terceroId={selectedTerceroId || 0} onSuccess={fetchTerceros} />
        <EliminarTerceroModal 
          opened={eliminarModalOpen} 
          onClose={() => setEliminarModalOpen(false)} 
          tenantId={tenantId} 
          terceroId={selectedTerceroId || 0} 
          terceroInfo={terceros.find(t => t.id === selectedTerceroId) ? {
            tipoIdentificacion: terceros.find(t => t.id === selectedTerceroId)!.tipoIdentificacion,
            identificacion: terceros.find(t => t.id === selectedTerceroId)!.identificacion,
            nombre: getNombre(terceros.find(t => t.id === selectedTerceroId)!),
            email: terceros.find(t => t.id === selectedTerceroId)!.email || ''
          } : null}
          onSuccess={fetchTerceros} 
        />
      </Box>
    </TenantLayout>
  );
}
