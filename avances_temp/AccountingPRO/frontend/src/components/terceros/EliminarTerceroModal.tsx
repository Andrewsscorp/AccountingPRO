import { useState, useEffect } from 'react';
import { Modal, Group, Button, Stack, Text, Alert, ThemeIcon, Card, Badge, Loader, Divider, Box } from '@mantine/core';
import { IconTrash, IconAlertTriangle, IconInfoCircle, IconCheck, IconX, IconBuilding } from '@tabler/icons-react';

interface EliminarTerceroModalProps {
  opened: boolean;
  onClose: () => void;
  tenantId: string;
  terceroId: number;
  terceroInfo: {
    tipoIdentificacion: string;
    identificacion: string;
    nombre: string;
    email: string;
  } | null;
  onSuccess: () => void;
}

export default function EliminarTerceroModal({ opened, onClose, tenantId, terceroId, terceroInfo, onSuccess }: EliminarTerceroModalProps) {
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [dependencias, setDependencias] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (opened && terceroId) {
      setLoading(true);
      setError(null);
      fetch(`http://localhost:3000/api/terceros/${tenantId}/terceros/${terceroId}/dependencias`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setDependencias(data.data);
          } else {
            setError(data.message || 'Error cargando dependencias');
          }
        })
        .catch(() => setError('Error de red al conectar con el servidor'))
        .finally(() => setLoading(false));
    }
  }, [opened, terceroId, tenantId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`http://localhost:3000/api/terceros/${tenantId}/terceros/${terceroId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error eliminando tercero');
    } finally {
      setDeleting(false);
    }
  };

  const handleInactivar = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`http://localhost:3000/api/terceros/${tenantId}/terceros/${terceroId}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: false })
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error inactivando tercero');
    } finally {
      setDeleting(false);
    }
  };

  if (!terceroInfo) return null;

  const hasDependencies = dependencias && Object.values(dependencias).some((val: any) => val > 0);

  const ValidationItem = ({ label, count }: { label: string, count: number }) => {
    const isClean = count === 0;
    return (
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <ThemeIcon color={isClean ? "green.1" : "red.1"} variant="light" size="sm" radius="xl">
            {isClean ? <IconCheck size={14} color="var(--mantine-color-green-6)" /> : <IconX size={14} color="var(--mantine-color-red-6)" />}
          </ThemeIcon>
          <Text size="sm">{label}</Text>
        </Group>
        <Text size="xs" fw={600} c={isClean ? "green.6" : "red.6"}>{isClean ? 'No tiene' : `${count} asociado(s)`}</Text>
      </Group>
    );
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={
        <Group gap="sm">
          <ThemeIcon color="red.1" variant="light" size="lg" radius="xl">
            <IconTrash size={20} color="var(--mantine-color-red-6)" />
          </ThemeIcon>
          <Text fw={700} size="xl">Eliminar Tercero</Text>
        </Group>
      } 
      size="lg" 
      centered
    >
      <Stack gap="md">
        <Alert icon={<IconAlertTriangle size={18} />} color={hasDependencies ? "orange" : "red"} variant="light">
          <Text fw={600} size="sm">¿Está seguro de eliminar este tercero?</Text>
          <Text size="xs" mt={4}>
            {hasDependencies ? 'Este tercero posee dependencias y solo puede ser inactivado.' : 'Esta acción no se puede deshacer.'}
          </Text>
        </Alert>

        <Card withBorder radius="md" padding="md" bg="gray.0">
          <Text fw={600} size="sm" mb="sm">Tercero seleccionado</Text>
          <Group gap="md" wrap="nowrap">
            <ThemeIcon size="xl" radius="md" color="violet.1" variant="light">
              <IconBuilding size={24} color="var(--mantine-color-violet-6)" />
            </ThemeIcon>
            <Stack gap={2}>
              <Group gap="xs">
                <Text size="sm" c="dimmed">Documento:</Text>
                <Text size="sm" fw={600}>{terceroInfo.identificacion}</Text>
                <Badge size="xs" variant="light" color="blue">{terceroInfo.tipoIdentificacion}</Badge>
              </Group>
              <Group gap="xs">
                <Text size="sm" c="dimmed">Nombre / Razón social:</Text>
                <Text size="sm" fw={600}>{terceroInfo.nombre}</Text>
              </Group>
              <Group gap="xs">
                <Text size="sm" c="dimmed">Correo:</Text>
                <Text size="sm">{terceroInfo.email || 'No registrado'}</Text>
              </Group>
            </Stack>
          </Group>
        </Card>

        {error && (
          <Alert color="red" variant="light" title="Error">
            <Text size="sm">{error}</Text>
          </Alert>
        )}

        <Box>
          <Text fw={600} size="sm" mb="md">Validaciones realizadas</Text>
          {loading ? (
            <Group justify="center" py="xl">
              <Loader color="violet" size="sm" />
              <Text size="sm" c="dimmed">Verificando dependencias...</Text>
            </Group>
          ) : dependencias ? (
            <>
              <ValidationItem label="Movimientos contables" count={dependencias.movimientos} />
              <ValidationItem label="Auditoría y configuraciones previas" count={dependencias.auditoria} />
              <ValidationItem label="Subcuentas o dependencias" count={dependencias.subcuentas} />
              <ValidationItem label="Facturas y documentos" count={dependencias.facturas} />
              <ValidationItem label="Pagos y recibos" count={dependencias.pagos} />
              <ValidationItem label="Documentos electrónicos" count={dependencias.documentosElectronicos} />
              <ValidationItem label="Uso en otros módulos" count={dependencias.otrosModulos} />

              <Alert 
                icon={<IconInfoCircle size={18} />} 
                color={hasDependencies ? "orange" : "blue"} 
                variant="light" 
                mt="md"
              >
                <Text size="sm">
                  {hasDependencies 
                    ? 'Este tercero tiene registros asociados. No puede eliminarse, pero puede ser marcado como Inactivo.'
                    : 'Este tercero no tiene registros asociados. Puede eliminarse de forma segura.'}
                </Text>
              </Alert>
            </>
          ) : null}
        </Box>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose} disabled={deleting}>Cancelar</Button>
          {!loading && (
            hasDependencies ? (
              <Button color="orange" onClick={handleInactivar} loading={deleting}>Inactivar Tercero</Button>
            ) : (
              <Button color="red" onClick={handleDelete} loading={deleting} leftSection={<IconTrash size={16} />}>Eliminar definitivamente</Button>
            )
          )}
        </Group>
      </Stack>
    </Modal>
  );
}
