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
  Checkbox,
  Loader,
  Center,
  ScrollArea,
  Menu,
  Pagination,
  Select,
  Modal
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconFileImport,
  IconFileExport,
  IconSearch,
  IconSettings,
  IconFilter,
  IconChevronDown,
  IconAlertTriangle
} from '@tabler/icons-react';
import TenantLayout from '../../components/layout/TenantLayout';
import { useNavigate } from 'react-router-dom';
import ConfigurarEstructuraModal from '../../components/contabilidad/ConfigurarEstructuraModal';
import CrearCuentaModal from '../../components/contabilidad/CrearCuentaModal';
import ModificarCuentaModal from '../../components/contabilidad/ModificarCuentaModal';
import EliminarCuentaModal from '../../components/contabilidad/EliminarCuentaModal';

interface Cuenta {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  naturaleza: string;
  nivel: number;
  cuentaPadreId: string | null;
  activa: boolean;
  requiereTercero: boolean;
  requiereCentroCosto: boolean;
  movimiento: boolean;
}

export default function PlanCuentas() {
  const navigate = useNavigate();
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('20');
  const [modalOpened, setModalOpened] = useState(false);
  const [crearCuentaOpened, setCrearCuentaOpened] = useState(false);
  const [modificarModalOpen, setModificarModalOpen] = useState(false);
  const [eliminarModalOpen, setEliminarModalOpen] = useState(false);
  const [selectedCuentaCodigo, setSelectedCuentaCodigo] = useState<string | null>(null);
  const [alertaMovimientoOpened, setAlertaMovimientoOpened] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('Todas las cuentas');

  const tenantId = localStorage.getItem('activeTenantId') || 'EMP000001';
  const selectedCuenta = cuentas.find(c => c.codigo === selectedCuentaCodigo);

  useEffect(() => {
    fetchCuentas();
  }, []);

  const fetchCuentas = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3000/api/contabilidad/${tenantId}/plan-cuentas`);
      const json = await res.json();
      if (json.success) {
        setCuentas(json.data);
      }
    } catch (error) {
      console.error('Error fetching cuentas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = async (codigo: string, field: 'requiereTercero' | 'requiereCentroCosto', value: boolean) => {
    // Optimistic update para UX rápida y en cascada
    setCuentas(prev => prev.map(c => {
      if (c.codigo.startsWith(codigo)) {
        return { ...c, [field]: value };
      }
      return c;
    }));

    try {
      await fetch(`http://localhost:3000/api/contabilidad/${tenantId}/plan-cuentas/${codigo}/toggle-flag`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value })
      });
    } catch (error) {
      console.error('Error actualizando la configuración de la cuenta:', error);
    }
  };

  const handleCrearCuentaClick = () => {
    if (!selectedCuentaCodigo) {
      alert("Seleccione una cuenta para crear una cuenta hija.");
      return;
    }
    const selectedCuenta = cuentas.find(c => c.codigo === selectedCuentaCodigo);
    if (selectedCuenta?.movimiento) {
      setAlertaMovimientoOpened(true);
    } else {
      setCrearCuentaOpened(true);
    }
  };

  const handleModificar = () => {
    if (!selectedCuentaCodigo) {
      alert('Debe seleccionar una cuenta primero.');
      return;
    }
    setModificarModalOpen(true);
  };

  const handleEliminar = () => {
    if (!selectedCuentaCodigo) {
      alert('Debe seleccionar una cuenta primero.');
      return;
    }
    setEliminarModalOpen(true);
  };

  const filteredCuentas = cuentas.filter(c => {
    const matchesSearch = c.codigo.includes(search) || c.nombre.toLowerCase().includes(search.toLowerCase());
    let matchesEstado = true;
    if (filtroEstado === 'Activas') matchesEstado = c.activa === true;
    if (filtroEstado === 'Inactivas') matchesEstado = c.activa === false;
    return matchesSearch && matchesEstado;
  });

  const items = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Contabilidad', href: '/contabilidad' },
    { title: 'Plan de Cuentas', href: '#' },
  ].map((item, index) => (
    <Anchor key={index} href={item.href} size="sm" color={index === 2 ? 'violet' : 'dimmed'} fw={index === 2 ? 600 : 400}>
      {item.title}
    </Anchor>
  ));

  const totalPages = Math.ceil(filteredCuentas.length / parseInt(pageSize));
  const paginatedCuentas = filteredCuentas.slice((page - 1) * parseInt(pageSize), page * parseInt(pageSize));

  return (
    <TenantLayout>
      <Box mb="md">
        <Breadcrumbs separator=">">{items}</Breadcrumbs>
      </Box>

      {/* Header section */}
      <Group justify="space-between" mb="lg" align="flex-start">
        <Box>
          <Title order={2} style={{ fontFamily: 'Inter, sans-serif', color: '#1a1b4b' }}>Plan de Cuentas</Title>
          <Text size="sm" color="dimmed">Administre el catálogo de cuentas contables de su empresa.</Text>
        </Box>
        <Group>
          <TextInput
            placeholder="Buscar cuenta..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ width: 250 }}
            radius="md"
          />
          <Button variant="default" radius="md" leftSection={<IconSettings size={16} />} onClick={() => setModalOpened(true)}>Configurar Estructura</Button>
        </Group>
      </Group>

      <ConfigurarEstructuraModal 
        opened={modalOpened} 
        onClose={() => setModalOpened(false)} 
        tenantId={tenantId}
        onSuccess={fetchCuentas}
      />

      <CrearCuentaModal
        opened={crearCuentaOpened}
        onClose={() => setCrearCuentaOpened(false)}
        tenantId={tenantId}
        padre={cuentas.find(c => c.codigo === selectedCuentaCodigo) || null}
        todasLasCuentas={cuentas}
        onSuccess={fetchCuentas}
      />

      <Modal opened={alertaMovimientoOpened} onClose={() => setAlertaMovimientoOpened(false)} title={<Group gap="xs"><IconAlertTriangle size={24} color="orange" /><Text fw={700}>No se puede crear la cuenta</Text></Group>} centered>
        <Text size="sm" mb="xl">
          La cuenta seleccionada está marcada para movimiento.<br/><br/>
          Para crear una subcuenta seleccione una cuenta de agrupación.
        </Text>
        <Group justify="flex-end">
          <Button color="violet" onClick={() => setAlertaMovimientoOpened(false)}>Entendido</Button>
        </Group>
      </Modal>

      <ModificarCuentaModal
        opened={modificarModalOpen}
        onClose={() => setModificarModalOpen(false)}
        tenantId={tenantId}
        cuenta={selectedCuenta || null}
        onSuccess={fetchCuentas}
      />

      <EliminarCuentaModal
        opened={eliminarModalOpen}
        onClose={() => setEliminarModalOpen(false)}
        tenantId={tenantId}
        cuenta={selectedCuenta ? { id: String(selectedCuenta.id), codigo: selectedCuenta.codigo, nombre: selectedCuenta.nombre } : null}
        onSuccess={() => {
          setSelectedCuentaCodigo(null);
          fetchCuentas();
        }}
      />

      {/* Toolbar */}
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <Button color="violet" radius="md" leftSection={<IconPlus size={16} />} onClick={handleCrearCuentaClick}>Crear Cuenta</Button>
          <Button variant="default" leftSection={<IconEdit size={16} />} onClick={handleModificar}>Modificar</Button>
          <Button variant="default" color="red" leftSection={<IconTrash size={16} />} c="red" onClick={handleEliminar}>Eliminar</Button>
          <Button variant="default" radius="md" leftSection={<IconFileImport size={16} />}>Importar</Button>
          <Button variant="default" radius="md" leftSection={<IconFileExport size={16} />}>Exportar</Button>
        </Group>
          <Group>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button variant="default" radius="md" leftSection={<IconFilter size={16} />} rightSection={<IconChevronDown size={14} />}>{filtroEstado}</Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => setFiltroEstado('Todas las cuentas')}>Todas las cuentas</Menu.Item>
                <Menu.Item onClick={() => setFiltroEstado('Activas')}>Activas</Menu.Item>
                <Menu.Item onClick={() => setFiltroEstado('Inactivas')}>Inactivas</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
      </Group>

      {/* Table Container */}
      <Box style={{ border: '1px solid #eaeaea', borderRadius: '8px', backgroundColor: '#fff' }}>
        {loading ? (
          <Center p="xl"><Loader color="violet" /></Center>
        ) : (
          <>
            <ScrollArea>
              <Table striped highlightOnHover verticalSpacing="sm" style={{ minWidth: 1000 }}>
                <Table.Thead>
                  <Table.Tr bg="gray.0">
                    <Table.Th style={{ width: '150px', paddingLeft: '20px' }}>CÓDIGO</Table.Th>
                    <Table.Th>NOMBRE</Table.Th>
                    <Table.Th style={{ textAlign: 'center', width: '120px' }}>TERCERO</Table.Th>
                    <Table.Th style={{ textAlign: 'center', width: '160px' }}>CENTRO DE COSTO</Table.Th>
                    <Table.Th style={{ width: '120px' }}>NATURALEZA</Table.Th>
                    <Table.Th style={{ textAlign: 'center', width: '120px' }}>MOVIMIENTO</Table.Th>
                    <Table.Th style={{ textAlign: 'center', width: '100px' }}>ESTADO</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedCuentas.map((cuenta) => {
                    const isSelected = selectedCuentaCodigo === cuenta.codigo;
                    return (
                  <Table.Tr 
                    key={cuenta.id} 
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--mantine-color-violet-light)' : undefined,
                      transition: 'background-color 0.2s ease',
                      borderLeft: isSelected ? '4px solid var(--mantine-color-violet-filled)' : '4px solid transparent'
                    }}
                    onClick={() => setSelectedCuentaCodigo(cuenta.codigo)}
                  >
                    <Table.Td style={{ paddingLeft: '20px' }}>
                      <Text fw={isSelected ? 900 : (!cuenta.movimiento ? 700 : 500)} size="sm" c={isSelected ? 'violet.9' : undefined}>{cuenta.codigo}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={isSelected ? 900 : (!cuenta.movimiento ? 700 : 500)} size="sm" c={isSelected ? 'violet.9' : undefined}>{cuenta.nombre}</Text>
                    </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <Checkbox 
                            checked={cuenta.requiereTercero} 
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleFlag(cuenta.codigo, 'requiereTercero', e.currentTarget.checked)
                            }} 
                            color="violet" 
                            style={{ display: 'inline-block' }} 
                          />
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <Checkbox 
                            checked={cuenta.requiereCentroCosto} 
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleFlag(cuenta.codigo, 'requiereCentroCosto', e.currentTarget.checked)
                            }} 
                            color="violet" 
                            style={{ display: 'inline-block' }} 
                          />
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c={cuenta.naturaleza === 'DEBITO' ? 'teal' : 'orange'} fw={500}>
                            {cuenta.naturaleza === 'DEBITO' ? 'Débito' : 'Crédito'}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <Text size="sm" color="dimmed">{cuenta.movimiento ? 'Sí' : ''}</Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          {cuenta.activa ? (
                            <Badge color="green" variant="light" radius="sm">Activa</Badge>
                          ) : (
                            <Badge color="gray" variant="light" radius="sm">Inactiva</Badge>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                  {filteredCuentas.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={7}>
                        <Center p="xl">
                          <Text color="dimmed">No se encontraron cuentas.</Text>
                        </Center>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </ScrollArea>
            
            {/* Pagination Footer */}
            <Group justify="space-between" p="md" style={{ borderTop: '1px solid #eaeaea' }}>
              <Text size="sm" color="dimmed">
                Mostrando {(page - 1) * parseInt(pageSize) + 1} a {Math.min(page * parseInt(pageSize), filteredCuentas.length)} de {filteredCuentas.length} cuentas
              </Text>
              <Group gap="md">
                <Pagination total={totalPages} value={page} onChange={setPage} color="violet" size="sm" />
                <Select
                  value={pageSize}
                  onChange={(val) => { setPageSize(val || '20'); setPage(1); }}
                  data={['10', '20', '50', '100']}
                  size="sm"
                  style={{ width: 130 }}
                  rightSection={<IconChevronDown size={14} />}
                />
              </Group>
            </Group>
          </>
        )}
      </Box>
    </TenantLayout>
  );
}
