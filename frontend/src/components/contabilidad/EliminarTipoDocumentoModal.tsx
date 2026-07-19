import { useState, useEffect } from 'react';
import { Modal, Group, Button, Text, Box, Alert, Loader, Center, Grid, Badge } from '@mantine/core';
import { IconAlertTriangle, IconTrash, IconFileInvoice, IconInfoCircle, IconCheck, IconX, IconBan, IconHash } from '@tabler/icons-react';

interface EliminarTipoDocumentoModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tipoId: number | null;
  codigo: string;
  nombre: string;
  modulo: string;
  clase: string;
}

export default function EliminarTipoDocumentoModal({
  opened,
  onClose,
  onSuccess,
  tipoId,
  codigo,
  nombre,
  modulo,
  clase
}: EliminarTipoDocumentoModalProps) {
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  
  // Validaciones
  const [comprobantes, setComprobantes] = useState(0);
  const [numeracion, setNumeracion] = useState(false);
  const [usuarios, setUsuarios] = useState(0);
  const [estado, setEstado] = useState('Activo');

  const tenantId = localStorage.getItem('activeTenantId') || 'EMP000001';
  const SYSTEM_DOCS = ['CC', 'CE', 'RC', 'FV', 'FC', 'NC', 'ND', 'CA', 'PR'];
  const esSistema = SYSTEM_DOCS.includes(codigo);

  useEffect(() => {
    if (opened && tipoId) {
      fetchValidations();
    }
  }, [opened, tipoId]);

  const fetchValidations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3000/api/tipos-documento/${tenantId}/tipos-documento/${tipoId}/validaciones`);
      const json = await res.json();
      if (json.success) {
        setComprobantes(json.data.comprobantesGenerados);
        setNumeracion(json.data.numeracionUtilizada);
        setUsuarios(json.data.usuariosAsociados);
        setEstado(json.data.estadoActual);
      }
    } catch (error) {
      console.error('Error fetching validations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    if (!tipoId) return;
    try {
      setProcesando(true);
      const res = await fetch(`http://localhost:3000/api/tipos-documento/${tenantId}/tipos-documento/${tipoId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete' })
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert('Error de red');
    } finally {
      setProcesando(false);
    }
  };

  const handleDesactivar = async () => {
    if (!tipoId) return;
    try {
      setProcesando(true);
      const res = await fetch(`http://localhost:3000/api/tipos-documento/${tenantId}/tipos-documento/${tipoId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate' })
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert('Error de red');
    } finally {
      setProcesando(false);
    }
  };

  const hasMovements = comprobantes > 0 || numeracion;
  const canDelete = !hasMovements && !esSistema;

  return (
    <Modal opened={opened} onClose={onClose} title={<Group gap="xs"><IconTrash color="red" /><Text fw={600}>Eliminar Tipo de Documento</Text></Group>} size="lg" centered>
      <Alert icon={<IconAlertTriangle size={16} />} title="¿Está seguro de eliminar el tipo documental seleccionado?" color="red" variant="light" mb="md">
        Esta acción no se puede deshacer.
      </Alert>

      <Box bg="gray.0" p="md" style={{ borderRadius: 8 }} mb="md">
        <Grid>
          <Grid.Col span={6}>
            <Text size="xs" c="dimmed" fw={600}>Código:</Text>
            <Text fw={600}>{codigo}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="xs" c="dimmed" fw={600}>Nombre:</Text>
            <Text fw={600}>{nombre}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="xs" c="dimmed" fw={600}>Módulo:</Text>
            <Text size="sm">{modulo}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="xs" c="dimmed" fw={600}>Clase:</Text>
            <Text size="sm">{clase}</Text>
          </Grid.Col>
        </Grid>
      </Box>

      <Text fw={600} size="sm" c="violet" mb="xs">VALIDACIONES PREVIAS</Text>
      
      {loading ? (
        <Center p="xl"><Loader size="sm" color="violet" /></Center>
      ) : (
        <Box mb="md">
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <IconFileInvoice size={18} color="gray" />
              <Text size="sm">Comprobantes generados:</Text>
            </Group>
            <Group gap="xs">
              <Text fw={600} c={comprobantes > 0 ? "red" : "gray"}>{comprobantes}</Text>
              {comprobantes > 0 ? <IconX size={16} color="red" /> : <IconCheck size={16} color="green" />}
            </Group>
          </Group>
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <IconHash size={18} color="gray" />
              <Text size="sm">Numeración utilizada:</Text>
            </Group>
            <Group gap="xs">
              <Text fw={600} c={numeracion ? "red" : "gray"}>{numeracion ? 'Sí' : 'No'}</Text>
              {numeracion ? <IconX size={16} color="red" /> : <IconCheck size={16} color="green" />}
            </Group>
          </Group>
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <Text size="sm" ml={22}>Usuarios asociados:</Text>
            </Group>
            <Group gap="xs">
              <Text fw={600}>{usuarios}</Text>
              {usuarios > 0 ? <IconX size={16} color="red" /> : <IconCheck size={16} color="green" />}
            </Group>
          </Group>
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <IconCheck size={18} color="gray" />
              <Text size="sm">Estado actual:</Text>
            </Group>
            <Group gap="xs">
              <Badge color={estado === 'Activo' ? 'green' : 'gray'} variant="light">{estado}</Badge>
              <IconCheck size={16} color="green" />
            </Group>
          </Group>
        </Box>
      )}

      {!loading && hasMovements && !esSistema && (
        <Alert icon={<IconAlertTriangle size={16} />} title="No se puede eliminar este tipo documental porque tiene información asociada." color="orange" variant="light" mb="sm">
          Puede desactivar el documento para evitar su uso en nuevos registros.
        </Alert>
      )}

      {!loading && esSistema && (
        <Alert icon={<IconBan size={16} />} title="Este tipo documental es del sistema y no puede eliminarse." color="orange" variant="light" mb="sm">
          Puede desactivar el documento para evitar su uso en nuevos registros.
        </Alert>
      )}

      {!loading && (
        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" mb="xl">
          La desactivación mantiene el historial y la integridad de la información. El documento no aparecerá en las listas operativas.
        </Alert>
      )}

      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onClose} disabled={procesando}>Cancelar</Button>
        <Group>
          <Button color="red" variant="outline" leftSection={<IconBan size={16} />} onClick={handleDesactivar} disabled={procesando || estado === 'Inactivo'}>
            Desactivar
          </Button>
          <Button 
            color="gray" 
            leftSection={<IconTrash size={16} />} 
            disabled={!canDelete || procesando}
            onClick={handleEliminar}
          >
            {canDelete ? 'Eliminar Definitivamente' : 'Eliminar Definitivamente (No disponible)'}
          </Button>
        </Group>
      </Group>
    </Modal>
  );
}
