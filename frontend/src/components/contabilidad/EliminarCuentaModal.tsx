import { useState, useEffect } from 'react';
import { Modal, Group, Button, Stack, Text, LoadingOverlay, Alert, Box, List, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle, IconInfoCircle, IconX, IconCheck } from '@tabler/icons-react';

interface Cuenta {
  id: string;
  codigo: string;
  nombre: string;
}

interface EliminarCuentaModalProps {
  opened: boolean;
  onClose: () => void;
  tenantId: string;
  cuenta: Cuenta | null;
  onSuccess: () => void;
}

export default function EliminarCuentaModal({ opened, onClose, tenantId, cuenta, onSuccess }: EliminarCuentaModalProps) {
  const [loading, setLoading] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (opened && cuenta) {
      validateDeletion();
    }
  }, [opened, cuenta]);

  const validateDeletion = async () => {
    if (!cuenta) return;
    setValidating(true);
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/contabilidad/${tenantId}/plan-cuentas/${cuenta.id}/validar-eliminacion`);
      const json = await res.json();
      if (json.success) {
        setCanDelete(json.data.canDelete);
        setReasons(json.data.reasons || []);
      }
    } catch (error) {
      console.error(error);
      setCanDelete(false);
      setReasons(['Error de conexión al validar la cuenta.']);
    } finally {
      setLoading(false);
      setValidating(false);
    }
  };

  const handleDelete = async () => {
    if (!cuenta || !canDelete) return;

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/contabilidad/${tenantId}/plan-cuentas/${cuenta.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();

      if (json.success) {
        onSuccess();
        onClose();
      } else {
        alert(json.message);
      }
    } catch (error) {
      console.error(error);
      alert('Error eliminando la cuenta');
    } finally {
      setLoading(false);
    }
  };

  if (!cuenta) return null;

  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={700}>Eliminar Cuenta</Text>} centered size="md">
      <Box style={{ position: 'relative' }}>
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        <Stack gap="md">
          {canDelete && !validating ? (
            <>
              <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light">
                <Text fw={700} mb={5}>¿Está seguro de eliminar esta cuenta?</Text>
                Esta acción no se puede deshacer.
              </Alert>

              <Box bg="gray.0" p="md" style={{ borderRadius: 8, border: '1px solid #e9ecef' }}>
                <Text size="sm" c="dimmed" mb={4}>Cuenta seleccionada</Text>
                <Text fw={500}>Código: {cuenta.codigo}</Text>
                <Text fw={500}>Nombre: {cuenta.nombre}</Text>
              </Box>

              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={onClose}>Cancelar</Button>
                <Button color="red" onClick={handleDelete}>Eliminar Definitivamente</Button>
              </Group>
            </>
          ) : !validating && reasons.length > 0 ? (
            <>
              <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light">
                <Text fw={700} mb={5}>¿Está seguro de eliminar esta cuenta?</Text>
                Esta acción no se puede deshacer.
              </Alert>

              <Box bg="gray.0" p="md" style={{ borderRadius: 8, border: '1px solid #e9ecef' }}>
                <Text size="sm" c="dimmed" mb={4}>Cuenta seleccionada</Text>
                <Text fw={500}>Código: {cuenta.codigo}</Text>
                <Text fw={500}>Nombre: {cuenta.nombre}</Text>
              </Box>

              <Box bg="red.0" p="md" style={{ borderRadius: 8, border: '1px solid #ffe3e3' }}>
                <Text c="red.9" fw={600} mb="xs">No se puede eliminar porque:</Text>
                <List
                  spacing="xs"
                  size="sm"
                  center
                  icon={
                    <ThemeIcon color="red.7" size={16} radius="xl" variant="transparent">
                      <IconX size={14} />
                    </ThemeIcon>
                  }
                >
                  {reasons.map((reason, idx) => (
                    <List.Item key={idx}>
                      <Text c="red.9">{reason}</Text>
                    </List.Item>
                  ))}
                </List>
              </Box>

              <Alert icon={<IconInfoCircle size={20} />} color="blue" variant="light" title="¿Qué puede hacer?">
                <Text size="sm" mb="xs">Para eliminar esta cuenta debe:</Text>
                <List type="ordered" size="sm" spacing={4}>
                  <List.Item>Inactivar la cuenta.</List.Item>
                  <List.Item>Inactivar o eliminar todas sus subcuentas.</List.Item>
                  <List.Item>Asegurarse que no tenga movimientos contables.</List.Item>
                  <List.Item>Verificar que no esté usada en comprobantes o configuraciones.</List.Item>
                </List>
              </Alert>

              <Group justify="center" mt="md">
                <Button variant="default" onClick={onClose}>Cancelar</Button>
                <Button color="violet" onClick={onClose}>Entendido</Button>
              </Group>
            </>
          ) : (
            <Text ta="center" py="xl" c="dimmed">Validando...</Text>
          )}
        </Stack>
      </Box>
    </Modal>
  );
}
