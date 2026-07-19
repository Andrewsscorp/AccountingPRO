import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Text,
  Group,
  Button,
  Table,
  ActionIcon,
  Tooltip,
  ThemeIcon,
  Modal,
  Select,
  TextInput,
  Grid,
  Title,
  Divider,
  Badge
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconEdit,
  IconTrash,
  IconBuildingBank,
  IconSearch,
  IconSettings
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import TenantLayout from '../../../components/layout/TenantLayout';
import GestorBancosModal from './GestorBancosModal';
import GestorSucursalesModal from './GestorSucursalesModal';
import GestorGruposModal from './GestorGruposModal';

export default function CuentasBancarias() {
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [bancos, setBancos] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [planCuentas, setPlanCuentas] = useState<any[]>([]);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isGestorBancosOpen, setIsGestorBancosOpen] = useState(false);
  const [isGestorSucursalesOpen, setIsGestorSucursalesOpen] = useState(false);
  const [isGestorGruposOpen, setIsGestorGruposOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    bancoId: '',
    tipo: '',
    numeroCuenta: '',
    sucursalId: '',
    cuentaContableId: '',
    grupoOperacionId: '',
    consecutivoCheque: '',
    formatoCheque: '',
    formatoProveedor: ''
  });
  
  const [errors, setErrors] = useState<any>({});
  
  const tenantId = localStorage.getItem('activeTenantId') || 'EMP000001';

  const fetchData = async () => {
    try {
      const [resCuentas, resBancos, resSucursales, resPlan, resGrupos] = await Promise.all([
        fetch(`http://localhost:3000/api/tesoreria/cuentas-bancarias`, { headers: { 'x-tenant-id': tenantId } }),
        fetch(`http://localhost:3000/api/tesoreria/bancos`, { headers: { 'x-tenant-id': tenantId } }),
        fetch(`http://localhost:3000/api/tesoreria/sucursales`, { headers: { 'x-tenant-id': tenantId } }),
        fetch(`http://localhost:3000/api/contabilidad/${tenantId}/plan-cuentas`),
        fetch(`http://localhost:3000/api/tesoreria/grupos-operaciones`, { headers: { 'x-tenant-id': tenantId } })
      ]);

      const dataCuentas = await resCuentas.json();
      const dataBancos = await resBancos.json();
      const dataSucursales = await resSucursales.json();
      const dataPlan = await resPlan.json();
      const dataGrupos = await resGrupos.json();

      if (dataCuentas.success) setCuentas(dataCuentas.data);
      if (dataBancos.success) setBancos(dataBancos.data);
      if (dataSucursales.success) setSucursales(dataSucursales.data);
      if (dataPlan.success) setPlanCuentas(dataPlan.data);
      if (dataGrupos.success) setGrupos(dataGrupos.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      notifications.show({ title: 'Error', message: 'No se pudieron cargar los datos', color: 'red' });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (cuenta: any) => {
    setEditingId(cuenta.id);
    setFormData({
      bancoId: cuenta.bancoId.toString(),
      tipo: cuenta.tipo,
      numeroCuenta: cuenta.numeroCuenta,
      sucursalId: cuenta.sucursalId.toString(),
      cuentaContableId: cuenta.cuentaContableId.toString(),
      grupoOperacionId: cuenta.grupoOperacionId?.toString() || '',
      consecutivoCheque: cuenta.consecutivoCheque || '',
      formatoCheque: cuenta.formatoCheque || '',
      formatoProveedor: cuenta.formatoProveedor || ''
    });
    setErrors({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      bancoId: '',
      tipo: '',
      numeroCuenta: '',
      sucursalId: '',
      cuentaContableId: '',
      grupoOperacionId: '',
      consecutivoCheque: '',
      formatoCheque: '',
      formatoProveedor: ''
    });
    setErrors({});
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta cuenta bancaria?')) return;

    try {
      const res = await fetch(`http://localhost:3000/api/tesoreria/cuentas-bancarias/${id}`, { 
        method: 'DELETE',
        headers: { 'x-tenant-id': tenantId }
      });
      const data = await res.json();
      if (data.success) {
        notifications.show({ title: 'Éxito', message: 'Cuenta eliminada', color: 'green' });
        fetchData();
      } else {
        notifications.show({ title: 'Error', message: data.message, color: 'red' });
      }
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Error', message: 'Error al eliminar', color: 'red' });
    }
  };

  const handleSave = async () => {
    const newErrors: any = {};
    if (!formData.bancoId) newErrors.bancoId = 'Seleccione un banco';
    if (!formData.tipo) newErrors.tipo = 'Seleccione un tipo de cuenta';
    if (!formData.numeroCuenta) newErrors.numeroCuenta = 'El número de la cuenta bancaria es un dato obligatorio';
    if (!formData.sucursalId) newErrors.sucursalId = 'Seleccione una sucursal';
    if (!formData.cuentaContableId) newErrors.cuentaContableId = 'Seleccione una cuenta contable';

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      notifications.show({ title: 'Validación', message: 'Por favor complete los campos obligatorios', color: 'red' });
      return;
    }

    try {
      const url = editingId 
        ? `http://localhost:3000/api/tesoreria/cuentas-bancarias/${editingId}`
        : 'http://localhost:3000/api/tesoreria/cuentas-bancarias';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId 
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        notifications.show({ title: 'Éxito', message: 'Cuenta guardada correctamente', color: 'green' });
        handleCancel();
        fetchData();
      } else {
        notifications.show({ title: 'Error', message: data.message, color: 'red' });
      }
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Error', message: 'Error de servidor', color: 'red' });
    }
  };

  // Mappers para selects
  const bancosData = bancos.map(b => ({ value: b.id.toString(), label: b.nombre }));
  const sucursalesData = sucursales
    .filter(s => s.bancoId?.toString() === formData.bancoId)
    .map(s => ({ value: s.id.toString(), label: s.nombre }));
  const gruposData = grupos.map(g => ({ value: g.id.toString(), label: g.nombre }));
  const cuentasContablesData = planCuentas.map(p => ({ value: p.id.toString(), label: `${p.codigo} - ${p.nombre}` }));

  return (
    <TenantLayout>
      <Box p="md">
        <Text c="dimmed" size="sm" mb="xs">Tesorería / Cuentas Bancarias</Text>
        
        <Group justify="space-between" mb="md">
          <Group>
            <ThemeIcon size="lg" variant="light" color="violet">
              <IconBuildingBank size={24} />
            </ThemeIcon>
            <Title order={2} style={{ color: '#2C2E33', fontWeight: 600 }}>Gestión de Cuentas Bancarias</Title>
          </Group>
          <Group>
            <Button 
              leftSection={<IconCheck size={16} />} 
              color="violet" 
              variant="light"
              onClick={handleSave}
              style={{ border: '1px solid #d0bfff' }}
            >
              Aceptar
            </Button>
            <Button 
              leftSection={<IconX size={16} />} 
              color="red" 
              variant="outline"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
          </Group>
        </Group>

        {/* Cuentas Existentes */}
        <Paper shadow="sm" p="md" radius="md" withBorder mb="lg">
          <Title order={4} mb="md" style={{ color: '#495057' }}>Cuentas Bancarias Existentes</Title>
          
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>Cuenta</Table.Th>
                <Table.Th>Sucursal</Table.Th>
                <Table.Th>Banco</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {cuentas.map((c, index) => (
                <Table.Tr key={c.id}>
                  <Table.Td>{index + 1}</Table.Td>
                  <Table.Td>{c.numeroCuenta}</Table.Td>
                  <Table.Td>{c.sucursal?.nombre}</Table.Td>
                  <Table.Td>{c.banco?.nombre}</Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <Group gap="xs" justify="center">
                      <ActionIcon variant="light" color="gray" onClick={() => handleEdit(c)}>
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon variant="light" color="red" onClick={() => handleDelete(c.id)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {cuentas.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5} style={{ textAlign: 'center' }}>No hay cuentas registradas</Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Paper>

        {/* Detalles de Cuenta Form */}
        <Paper shadow="sm" p="md" radius="md" withBorder>
          <Group mb="sm">
            <Title order={4} style={{ color: '#495057' }}>
              Detalles de Cuenta ({editingId ? 'Editando' : 'Creando'})
            </Title>
          </Group>
          
          <Grid gutter="xl">
            {/* Lado Izquierdo */}
            <Grid.Col span={6}>
              <Text fw={600} mb="sm" size="sm">Lado Izquierdo (Datos Principales)</Text>
              
              <Group mb="sm" align="flex-end">
                <div style={{ flex: 1 }}>
                  <Text size="sm" mb={4}>Banco:</Text>
                  <Select
                    data={bancosData}
                    placeholder="Q Banco"
                    searchable
                    leftSection={<IconSearch size={14} />}
                    value={formData.bancoId}
                    onChange={(v) => setFormData({...formData, bancoId: v || '', sucursalId: ''})}
                    error={errors.bancoId}
                  />
                </div>
                <Tooltip label="Gestionar Bancos">
                  <ActionIcon 
                    variant="light" 
                    color="blue" 
                    size={36} 
                    onClick={() => setIsGestorBancosOpen(true)}
                  >
                    <IconSettings size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <Group mb="sm" align="center">
                <Text size="sm" w={120}>Tipo:</Text>
                <Select
                  data={[
                    { value: 'Ahorros', label: 'Ahorros' },
                    { value: 'Corriente', label: 'Corriente' }
                  ]}
                  style={{ flex: 1 }}
                  value={formData.tipo}
                  onChange={(v) => setFormData({...formData, tipo: v || ''})}
                  error={errors.tipo}
                />
              </Group>

              <Group mb="sm" align="flex-start">
                <Text size="sm" w={120} mt={6}>Cuenta bancaria:</Text>
                <Box style={{ flex: 1 }}>
                  <TextInput
                    value={formData.numeroCuenta}
                    onChange={(e) => setFormData({...formData, numeroCuenta: e.currentTarget.value})}
                    error={errors.numeroCuenta}
                    styles={{ input: { borderColor: errors.numeroCuenta ? 'red' : undefined } }}
                  />
                  {errors.numeroCuenta && (
                    <Text c="red" size="xs" mt={4} fw={500}>{errors.numeroCuenta}</Text>
                  )}
                </Box>
              </Group>
            </Grid.Col>

            {/* Contabilidad y Control */}
            <Grid.Col span={6}>
              <Text fw={600} mb="sm" size="sm">Contabilidad y Control)</Text>

              <Group mb="sm" align="flex-end">
                <div style={{ flex: 1 }}>
                  <Text size="sm" mb={4}>Sucursal:</Text>
                  <Select
                    data={sucursalesData}
                    placeholder={formData.bancoId ? "Sede Principal" : "Seleccione un banco primero"}
                    disabled={!formData.bancoId}
                    searchable
                    leftSection={<IconSearch size={14} />}
                    value={formData.sucursalId}
                    onChange={(v) => setFormData({...formData, sucursalId: v || ''})}
                    error={errors.sucursalId}
                  />
                </div>
                <Tooltip label="Gestionar Sucursales">
                  <ActionIcon 
                    variant="light" 
                    color="blue" 
                    size={36} 
                    onClick={() => setIsGestorSucursalesOpen(true)}
                  >
                    <IconSettings size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <Group mb="sm" align="center">
                <Text size="sm" w={140}>Cuenta (Contable):</Text>
                <Select
                  data={cuentasContablesData}
                  placeholder="Q 111005 - Moneda Nacional"
                  searchable
                  style={{ flex: 1 }}
                  leftSection={<IconSearch size={14} />}
                  value={formData.cuentaContableId}
                  onChange={(v) => setFormData({...formData, cuentaContableId: v || ''})}
                  error={errors.cuentaContableId}
                />
              </Group>

              <Group mb="sm" align="flex-end">
                <div style={{ flex: 1 }}>
                  <Text size="sm" mb={4}>Grupo de Operaciones:</Text>
                  <Select
                    data={gruposData}
                    placeholder="Ej. Operaciones Nacionales"
                    searchable
                    value={formData.grupoOperacionId}
                    onChange={(v) => setFormData({...formData, grupoOperacionId: v || ''})}
                  />
                </div>
                <Tooltip label="Gestionar Grupos">
                  <ActionIcon 
                    variant="light" 
                    color="blue" 
                    size={36} 
                    onClick={() => setIsGestorGruposOpen(true)}
                  >
                    <IconSettings size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <Group mb="sm" align="center">
                <Text size="sm" w={140}>Consecutivo cheque:</Text>
                <TextInput
                  style={{ flex: 1 }}
                  value={formData.consecutivoCheque}
                  onChange={(e) => setFormData({...formData, consecutivoCheque: e.currentTarget.value})}
                />
              </Group>

              <Group mb="sm" align="center">
                <Text size="sm" w={140}>Formato cheque:</Text>
                <Select
                  data={[
                    { value: 'Estandar', label: 'Estándar' }
                  ]}
                  style={{ flex: 1 }}
                  value={formData.formatoCheque}
                  onChange={(v) => setFormData({...formData, formatoCheque: v || ''})}
                />
              </Group>

              <Group mb="sm" align="center">
                <Text size="sm" w={140}>Formato proveedor:</Text>
                <Select
                  data={[
                    { value: 'Estandar', label: 'Estándar' }
                  ]}
                  style={{ flex: 1 }}
                  value={formData.formatoProveedor}
                  onChange={(v) => setFormData({...formData, formatoProveedor: v || ''})}
                />
              </Group>

            </Grid.Col>
          </Grid>
          
          <Divider my="md" />
          <Group justify="center">
             <Badge color="gray" variant="light" size="lg">
                {editingId ? 'Editando' : 'Creando'}
             </Badge>
          </Group>
        </Paper>
      </Box>

      <GestorBancosModal 
        opened={isGestorBancosOpen}
        onClose={() => setIsGestorBancosOpen(false)}
        bancos={bancos}
        tenantId={tenantId}
        onSuccess={fetchData}
      />

      <GestorSucursalesModal 
        opened={isGestorSucursalesOpen}
        onClose={() => setIsGestorSucursalesOpen(false)}
        sucursales={sucursales}
        bancos={bancos}
        tenantId={tenantId}
        onSuccess={fetchData}
      />

      <GestorGruposModal
        opened={isGestorGruposOpen}
        onClose={() => setIsGestorGruposOpen(false)}
        grupos={grupos}
        tenantId={tenantId}
        onSuccess={fetchData}
      />
    </TenantLayout>
  );
}
