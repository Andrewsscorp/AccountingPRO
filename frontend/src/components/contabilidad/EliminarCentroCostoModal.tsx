import React, { useState, useEffect } from 'react';
import { Modal, Button, Text, Group, Stack, Badge, Box, Alert, LoadingOverlay } from '@mantine/core';
import { IconAlertTriangle, IconBan, IconCheck, IconTrash, IconX, IconHierarchy, IconInfoCircle } from '@tabler/icons-react';

interface Props {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  centroId: number | null;
  codigo: string;
  nombre: string;
}

export default function EliminarCentroCostoModal({ opened, onClose, onSuccess, centroId, codigo, nombre }: Props) {
  const tenantId = localStorage.getItem('activeTenantId') || 'EMP000001';
  const [loading, setLoading] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const [movimientos, setMovimientos] = useState(0);
  const [hijos, setHijos] = useState(0);
  const [presupuestos, setPresupuestos] = useState(0);
  const [estado, setEstado] = useState('');

  useEffect(() => {
    if (opened && centroId) {
      fetchValidaciones();
    }
  }, [opened, centroId]);

  const fetchValidaciones = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/centros-costo/${tenantId}/centros-costo/${centroId}/validaciones`);
      const data = await res.json();
      if (data.success) {
        setMovimientos(data.data.movimientos);
        setHijos(data.data.hijos);
        setPresupuestos(data.data.presupuestos);
        setEstado(data.data.estadoActual);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'delete' | 'deactivate') => {
    setProcesando(true);
    try {
      const res = await fetch(`http://localhost:3000/api/centros-costo/${tenantId}/centros-costo/${centroId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al procesar la solicitud.');
    } finally {
      setProcesando(false);
    }
  };

  const hasDependencies = movimientos > 0 || hijos > 0;
  const canDelete = !hasDependencies;
  const canDeactivate = estado === 'Activo' && hijos === 0;

  return (
    <Modal opened={opened} onClose={onClose} title={<Group><IconTrash color="red" /> <Text fw={600}>Eliminar Centro de Costos</Text></Group>} size="md">
      <Box pos="relative">
        <LoadingOverlay visible={loading || procesando} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

        <Stack gap="md">
          <Box bg="gray.0" p="sm" style={{ borderRadius: 8 }}>
            <Group grow align="flex-start">
              <div>
                <Text size="xs" c="dimmed">Código:</Text>
                <Text fw={600}>{codigo}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Nombre:</Text>
                <Text fw={600}>{nombre}</Text>
              </div>
            </Group>
          </Box>

          <Text fw={600} size="sm" c="violet">VALIDACIONES PREVIAS</Text>
          <Stack gap="xs" ml="sm">
            <Group justify="space-between">
              <Text size="sm" display="flex" style={{ gap: 8 }}><IconCheck size={16} color="gray" /> Movimientos generados:</Text>
              <Group gap="xs">
                <Text size="sm" fw={500}>{movimientos}</Text>
                {movimientos > 0 ? <IconX size={16} color="red" /> : <IconCheck size={16} color="green" />}
              </Group>
            </Group>
            <Group justify="space-between">
              <Text size="sm" display="flex" style={{ gap: 8 }}><IconHierarchy size={16} color="gray" /> Centros Hijos:</Text>
              <Group gap="xs">
                <Text size="sm" fw={500}>{hijos}</Text>
                {hijos > 0 ? <IconX size={16} color="red" /> : <IconCheck size={16} color="green" />}
              </Group>
            </Group>
            <Group justify="space-between">
              <Text size="sm" display="flex" style={{ gap: 8 }}><IconCheck size={16} color="gray" /> Presupuestos asignados:</Text>
              <Group gap="xs">
                <Text size="sm" fw={500}>{presupuestos}</Text>
                {presupuestos > 0 ? <IconAlertTriangle size={16} color="orange" /> : <IconCheck size={16} color="green" />}
              </Group>
            </Group>
            <Group justify="space-between">
              <Text size="sm" display="flex" style={{ gap: 8 }}><IconCheck size={16} color="gray" /> Estado actual:</Text>
              <Group gap="xs">
                <Badge size="sm" color={estado === 'Activo' ? 'green' : 'red'}>{estado}</Badge>
                <IconCheck size={16} color="green" />
              </Group>
            </Group>
          </Stack>

          {hasDependencies ? (
            <>
              <Alert icon={<IconBan size={16} />} title="No se puede eliminar físicamente" color="orange" variant="light">
                Este centro posee movimientos o subcentros asociados. Puede <b>desactivarlo</b> para evitar su uso futuro.
              </Alert>
              {hijos > 0 && (
                <Alert icon={<IconAlertTriangle size={16} />} title="Desactivación Bloqueada" color="red" variant="light">
                  No puede desactivar un centro que tiene centros hijos. Debe desactivar los hijos primero.
                </Alert>
              )}
            </>
          ) : (
            <Alert icon={<IconInfoCircle size={16} />} title="Eliminación Permitida" color="blue" variant="light">
              Este centro no tiene dependencias y será eliminado permanentemente del sistema.
            </Alert>
          )}
        </Stack>

        <Group justify="space-between" mt="xl">
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Group>
            <Button 
              color="red" variant="outline" 
              leftSection={<IconBan size={16} />} 
              onClick={() => handleAction('deactivate')} 
              disabled={!canDeactivate}
            >
              Desactivar
            </Button>
            <Button 
              color="red" 
              leftSection={<IconTrash size={16} />} 
              onClick={() => handleAction('delete')} 
              disabled={!canDelete}
            >
              Eliminar Definitivamente
            </Button>
          </Group>
        </Group>
      </Box>
    </Modal>
  );
}
