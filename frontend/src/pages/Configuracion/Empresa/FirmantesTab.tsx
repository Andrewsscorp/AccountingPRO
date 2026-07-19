import React, { useState, useEffect } from 'react';
import {
  Box,
  Title,
  Text,
  Button,
  Group,
  TextInput,
  Select,
  Grid,
  FileInput,
  Image,
  ActionIcon,
  Table,
  Badge,
  Paper,
  Divider,
  ScrollArea,
  Pagination,
  Stack,
  ThemeIcon,
  Alert,
  Modal
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconUpload,
  IconCheck,
  IconX,
  IconEdit,
  IconTrash,
  IconPlus,
  IconSearch,
  IconUsers,
  IconEraser,
  IconInfoCircle
} from '@tabler/icons-react';

interface Firmante {
  id: number;
  nombre: string;
  cargo: string;
  tipoDocumento: string;
  documento: string;
  correo: string;
  telefono: string;
  tarjetaProfesional?: string;
  fechaExpedicionTarjeta?: string;
  firmaImagen?: string;
  selloImagen?: string;
  permisosFirma?: string;
  estado: string;
  terceroId?: number | null;
  tercero?: {
    id: number;
    identificacion: string;
    razonSocial?: string;
    nombre1?: string;
    apellido1?: string;
    nombreComercial?: string;
    nombre2?: string;
    apellido2?: string;
  } | null;
}

const getBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export default function FirmantesTab() {
  const [firmantes, setFirmantes] = useState<Firmante[]>([]);
  const [terceros, setTerceros] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<string | null>('Todos');
  const [page, setPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; id: number | null; nombre: string }>({ open: false, id: null, nombre: '' });
  const itemsPerPage = 5;

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    cargo: '',
    tipoDocumento: 'CC',
    documento: '',
    correo: '',
    telefono: '',
    tarjetaProfesional: '',
    fechaExpedicionTarjeta: '',
    firmaImagen: '',
    selloImagen: '',
    estado: 'Activo',
    terceroId: ''
  });

  const tenantId = localStorage.getItem('tenantId') || 'EMP000004';

  const fetchFirmantes = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/configuracion/firmantes`, {
        headers: { 'x-tenant-id': tenantId }
      });
      const data = await response.json();
      if (data.success) {
        setFirmantes(data.data);
      }
    } catch (error) {
      console.error('Error fetching firmantes', error);
    }
  };

  const fetchTerceros = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/terceros/${tenantId}/terceros`);
      const data = await response.json();
      if (data.success) {
        setTerceros(data.data);
      }
    } catch (error) {
      console.error('Error fetching terceros', error);
    }
  };

  useEffect(() => {
    fetchFirmantes();
    fetchTerceros();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      nombre: '',
      cargo: '',
      tipoDocumento: 'CC',
      documento: '',
      correo: '',
      telefono: '',
      tarjetaProfesional: '',
      fechaExpedicionTarjeta: '',
      firmaImagen: '',
      selloImagen: '',
      estado: 'Activo',
      terceroId: ''
    });
  };

  const handleEdit = (firmante: Firmante) => {
    setEditingId(firmante.id);
    const dateStr = (firmante.fechaExpedicionTarjeta && !isNaN(Date.parse(firmante.fechaExpedicionTarjeta)))
      ? new Date(firmante.fechaExpedicionTarjeta).toISOString().split('T')[0]
      : '';

    setFormData({
      nombre: firmante.nombre,
      cargo: firmante.cargo,
      tipoDocumento: firmante.tipoDocumento || 'CC',
      documento: firmante.documento || '',
      correo: firmante.correo || '',
      telefono: firmante.telefono || '',
      tarjetaProfesional: firmante.tarjetaProfesional || '',
      fechaExpedicionTarjeta: dateStr,
      firmaImagen: firmante.firmaImagen || '',
      selloImagen: firmante.selloImagen || '',
      estado: firmante.estado || 'Activo',
      terceroId: firmante.terceroId ? String(firmante.terceroId) : ''
    });
  };

  const handleTerceroChange = (val: string | null) => {
    if (!val) {
      setFormData(prev => ({
        ...prev,
        terceroId: '',
        nombre: '',
        tipoDocumento: 'CC',
        documento: '',
        correo: '',
        telefono: ''
      }));
      return;
    }
    
    const selected = terceros.find(t => String(t.id) === val);
    if (selected) {
      const name = selected.tipoPersona === 'JURIDICA'
        ? selected.razonSocial || selected.nombreComercial || ''
        : `${selected.nombre1 || ''} ${selected.nombre2 || ''} ${selected.apellido1 || ''} ${selected.apellido2 || ''}`.replace(/\s+/g, ' ').trim();
        
      setFormData(prev => ({
        ...prev,
        terceroId: val,
        nombre: name,
        tipoDocumento: selected.tipoIdentificacion || 'CC',
        documento: selected.identificacion || '',
        correo: selected.email || '',
        telefono: selected.celular || selected.telefono || ''
      }));
    }
  };

  const handleInactivar = async (id: number) => {
    try {
      await fetch(`http://localhost:3000/api/configuracion/firmantes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ estado: 'Inactivo' })
      });
      notifications.show({
        title: 'Funcionario Inactivado',
        message: 'El funcionario se inactivó exitosamente.',
        color: 'orange'
      });
      fetchFirmantes();
      if (editingId === id) resetForm();
    } catch (error) {
      console.error('Error inactivating', error);
    }
  };

  const handleFileChange = async (file: File | null, field: 'firmaImagen' | 'selloImagen') => {
    if (file) {
      try {
        const base64 = await getBase64(file);
        setFormData(prev => ({ ...prev, [field]: base64 }));
      } catch (err) {
        console.error('Error converting file to base64', err);
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.terceroId) {
      notifications.show({
        title: 'Tercero Requerido',
        message: 'Por favor vincule el funcionario a un tercero.',
        color: 'red',
        icon: <IconX size={18} />
      });
      return;
    }

    if (!formData.nombre || !formData.cargo) {
      notifications.show({
        title: 'Campos obligatorios',
        message: 'Por favor complete Nombre Completo y Cargo / Título.',
        color: 'red',
        icon: <IconX size={18} />
      });
      return;
    }

    // Validate tarjeta profesional for Contador and Revisor Fiscal
    if (
      (formData.cargo === 'Contador Público' || formData.cargo === 'Revisor Fiscal') &&
      !formData.tarjetaProfesional
    ) {
      notifications.show({
        title: 'Tarjeta Profesional Requerida',
        message: `El cargo ${formData.cargo} requiere Tarjeta Profesional.`,
        color: 'red',
        icon: <IconX size={18} />
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        permisosFirma: JSON.stringify({
          facturas: true,
          comprobantes: true,
          reportes: true,
          certificados: true,
          cheques: false
        })
      };

      const url = editingId
        ? `http://localhost:3000/api/configuracion/firmantes/${editingId}`
        : `http://localhost:3000/api/configuracion/firmantes`;

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        notifications.show({
          title: editingId ? 'Funcionario Actualizado' : 'Funcionario Registrado',
          message: 'Los datos se guardaron exitosamente.',
          color: 'green',
          icon: <IconCheck size={18} />
        });
        fetchFirmantes();
        resetForm();
      } else {
        notifications.show({
          title: 'Error',
          message: data.message || 'Error al guardar el funcionario.',
          color: 'red'
        });
      }
    } catch (error) {
      console.error('Error saving firmante', error);
      notifications.show({
        title: 'Error de Conexión',
        message: 'No se pudo contactar con el servidor.',
        color: 'red'
      });
    }
    setLoading(false);
  };

  // Filter and paginate
  const filteredFirmantes = firmantes.filter((f) => {
    const matchesSearch =
      !searchQuery ||
      f.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.cargo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.documento.includes(searchQuery);
    const matchesEstado =
      !filterEstado || filterEstado === 'Todos' || f.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  const totalPages = Math.max(1, Math.ceil(filteredFirmantes.length / itemsPerPage));
  const paginatedFirmantes = filteredFirmantes.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const selectTerceroData = terceros.map(t => {
    const name = t.tipoPersona === 'JURIDICA'
      ? t.razonSocial || t.nombreComercial || ''
      : `${t.nombre1 || ''} ${t.apellido1 || ''}`;
    return {
      value: String(t.id),
      label: `${t.identificacion} - ${name}`
    };
  });

  return (
    <>
    <Grid gap="xl">
      {/* ─── COLUMNA IZQUIERDA: Lista ─── */}
      <Grid.Col span={{ base: 12, lg: 5 }}>
        <Group justify="space-between" mb="md">
          <Title order={4} style={{ fontFamily: 'Inter, sans-serif' }}>
            Funcionarios Registrados
          </Title>
          <Button
            leftSection={<IconPlus size={16} />}
            variant="filled"
            color="violet"
            size="xs"
            onClick={resetForm}
          >
            Nuevo
          </Button>
        </Group>

        <Group mb="md" grow>
          <TextInput
            placeholder="Buscar funcionario..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.currentTarget.value);
              setPage(1);
            }}
          />
          <Select
            placeholder="Estado: Todos"
            data={['Todos', 'Activo', 'Inactivo']}
            value={filterEstado}
            onChange={(v) => {
              setFilterEstado(v);
              setPage(1);
            }}
            style={{ maxWidth: 180 }}
            clearable={false}
          />
        </Group>

        <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
          <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
              <Table.Tr>
                <Table.Th>NOMBRE Y CARGO</Table.Th>
                <Table.Th>CONTACTO</Table.Th>
                <Table.Th>FIRMA</Table.Th>
                <Table.Th>ESTADO</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>ACCIONES</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedFirmantes.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Stack align="center" py="xl" gap="xs">
                      <ThemeIcon variant="light" color="violet" size={50} radius="xl">
                        <IconUsers size={28} />
                      </ThemeIcon>
                      <Text fw={500} c="dimmed">
                        No hay funcionarios registrados
                      </Text>
                      <Text size="xs" c="dimmed">
                        Haz clic en 'Nuevo' para registrar el primer funcionario.
                      </Text>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paginatedFirmantes.map((f) => (
                  <Table.Tr
                    key={f.id}
                    style={{
                      cursor: 'pointer',
                      backgroundColor:
                        editingId === f.id ? '#f0eeff' : undefined
                    }}
                    onClick={() => handleEdit(f)}
                  >
                    <Table.Td>
                      <Text size="sm" fw={600}>
                        {f.nombre}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {f.cargo}
                      </Text>
                      {f.tercero && (
                        <Text size="10px" c="violet" style={{ display: 'block', marginTop: 2 }}>
                          🔗 Nit/CC: {f.tercero.identificacion}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">{f.documento}</Text>
                      <Text size="xs" c="dimmed">
                        {f.correo}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {f.firmaImagen ? (
                        <IconCheck size={18} color="green" />
                      ) : (
                        <IconX size={18} color="#ccc" />
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="light"
                        color={f.estado === 'Activo' ? 'green' : 'gray'}
                        size="sm"
                      >
                        {f.estado}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          size="sm"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleEdit(f);
                          }}
                          title="Editar funcionario"
                        >
                          <IconEdit size={14} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          size="sm"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setConfirmModal({ open: true, id: f.id, nombre: f.nombre });
                          }}
                          title="Inactivar funcionario"
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Paper>

        <Group justify="space-between" mt="sm">
          <Text size="xs" c="dimmed">
            Mostrando {paginatedFirmantes.length} de {filteredFirmantes.length}{' '}
            funcionarios
          </Text>
          <Pagination
            total={totalPages}
            value={page}
            onChange={setPage}
            size="sm"
            color="violet"
          />
        </Group>
      </Grid.Col>

      {/* ─── COLUMNA DERECHA: Formulario ─── */}
      <Grid.Col span={{ base: 12, lg: 7 }}>
        <Paper withBorder p="xl" radius="md">
          <Group justify="space-between" mb="lg">
            <Title order={4} style={{ fontFamily: 'Inter, sans-serif' }}>
              {editingId ? 'Editar Funcionario' : 'Nuevo Funcionario'}
            </Title>
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconEraser size={16} />}
              size="xs"
              onClick={resetForm}
            >
              Limpiar Formulario
            </Button>
          </Group>

          <Grid gap="md">
            {/* Vincular a Tercero (Obligatorio) */}
            <Grid.Col span={12}>
              <Select
                label="Vincular a Tercero (Obligatorio)"
                withAsterisk
                placeholder="Busque o seleccione un tercero..."
                data={selectTerceroData}
                value={formData.terceroId || null}
                onChange={handleTerceroChange}
                searchable
                clearable
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label="Nombre Completo"
                disabled
                placeholder="Se autocompleta con el Tercero"
                value={formData.nombre}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Cargo / Título"
                withAsterisk
                placeholder="Ej. Contador Público"
                data={[
                  'Representante Legal',
                  'Contador Público',
                  'Revisor Fiscal',
                  'Gerente General',
                  'Director Financiero',
                  'Tesorero',
                  'Secretario General',
                  'Socio Firmante',
                  'Apoderado',
                  'Otro'
                ]}
                value={formData.cargo || null}
                onChange={(v) => setFormData((prev) => ({ ...prev, cargo: v || '' }))}
                searchable
                clearable={false}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label="Tipo Documento"
                disabled
                placeholder="Se autocompleta con el Tercero"
                value={formData.tipoDocumento}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Número de Documento"
                disabled
                placeholder="Se autocompleta con el Tercero"
                value={formData.documento}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label="Correo Electrónico"
                disabled
                placeholder="Se autocompleta con el Tercero"
                value={formData.correo}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Teléfono de Contacto"
                disabled
                placeholder="Se autocompleta con el Tercero"
                value={formData.telefono}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label="No. Tarjeta Profesional (Condicional)"
                placeholder="Obligatorio para Contador/Revisor"
                value={formData.tarjetaProfesional}
                onChange={(e) => {
                  const val = e.currentTarget.value;
                  setFormData((prev) => ({ ...prev, tarjetaProfesional: val }));
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Fecha Expedición T.P."
                type="date"
                placeholder="dd/mm/aaaa"
                value={formData.fechaExpedicionTarjeta}
                onChange={(e) => {
                  const val = e.currentTarget.value;
                  setFormData((prev) => ({ ...prev, fechaExpedicionTarjeta: val }));
                }}
              />
            </Grid.Col>

            {/* Subida de Firma y Sello Digital */}
            <Grid.Col span={6}>
              <FileInput
                label="Firma Digital (Imagen)"
                placeholder={formData.firmaImagen ? "Firma cargada" : "Seleccionar firma"}
                leftSection={<IconUpload size={14} />}
                accept="image/*"
                onChange={(file) => handleFileChange(file, 'firmaImagen')}
              />
              {formData.firmaImagen && (
                <Box mt="xs" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Image
                    src={formData.firmaImagen}
                    height={40}
                    fit="contain"
                    style={{ border: '1px solid #eee', borderRadius: '4px' }}
                  />
                  <Button size="compact-xs" variant="subtle" color="red" onClick={() => setFormData(prev => ({ ...prev, firmaImagen: '' }))}>
                    Eliminar
                  </Button>
                </Box>
              )}
            </Grid.Col>
            <Grid.Col span={6}>
              <FileInput
                label="Sello Digital (Imagen)"
                placeholder={formData.selloImagen ? "Sello cargado" : "Seleccionar sello"}
                leftSection={<IconUpload size={14} />}
                accept="image/*"
                onChange={(file) => handleFileChange(file, 'selloImagen')}
              />
              {formData.selloImagen && (
                <Box mt="xs" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Image
                    src={formData.selloImagen}
                    height={40}
                    fit="contain"
                    style={{ border: '1px solid #eee', borderRadius: '4px' }}
                  />
                  <Button size="compact-xs" variant="subtle" color="red" onClick={() => setFormData(prev => ({ ...prev, selloImagen: '' }))}>
                    Eliminar
                  </Button>
                </Box>
              )}
            </Grid.Col>
          </Grid>

          <Alert
            icon={<IconInfoCircle size={16} />}
            color="violet"
            variant="light"
            mt="xl"
          >
            <Text size="xs" fw={500}>
              Los campos marcados con * son obligatorios.
            </Text>
            <Text size="xs" c="dimmed">
              La vinculación a un Tercero es obligatoria para garantizar la consistencia de los datos del funcionario en el sistema contable.
            </Text>
          </Alert>

          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={resetForm}>
              Restablecer
            </Button>
            <Button
              color="violet"
              loading={loading}
              onClick={handleSubmit}
              leftSection={<IconCheck size={16} />}
            >
              {editingId ? 'Guardar Cambios' : 'Registrar Funcionario'}
            </Button>
          </Group>
        </Paper>
      </Grid.Col>
    </Grid>

    {/* Modal de confirmación para inactivar */}
    <Modal
      opened={confirmModal.open}
      onClose={() => setConfirmModal({ open: false, id: null, nombre: '' })}
      title="Confirmar Inactivación"
      centered
      size="sm"
    >
      <Text size="sm" mb="lg">
        ¿Está seguro que desea inactivar al funcionario <Text span fw={700}>{confirmModal.nombre}</Text>?
      </Text>
      <Text size="xs" c="dimmed" mb="xl">
        El funcionario no será eliminado, pero dejará de estar disponible para firmar documentos y reportes.
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={() => setConfirmModal({ open: false, id: null, nombre: '' })}>
          Cancelar
        </Button>
        <Button
          color="red"
          onClick={() => {
            if (confirmModal.id) handleInactivar(confirmModal.id);
            setConfirmModal({ open: false, id: null, nombre: '' });
          }}
        >
          Sí, Inactivar
        </Button>
      </Group>
    </Modal>
    </>
  );
}
