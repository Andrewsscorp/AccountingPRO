import React, { useEffect, useState } from 'react';
import { Modal, Table, Button, Group, Text, ActionIcon, Loader, Center } from '@mantine/core';
import { IconCheck, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';

interface LibreriaComprobantesModalProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (plantilla: any) => void;
}

export default function LibreriaComprobantesModal({ opened, onClose, onSelect }: LibreriaComprobantesModalProps) {
  const [plantillas, setPlantillas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const tenantId = localStorage.getItem('activeTenantId') || 'EMP000001';

  const fetchPlantillas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/contabilidad/${tenantId}/doc-libreria`);
      const data = await res.json();
      if (data.success) {
        setPlantillas(data.data);
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'No se pudieron cargar las plantillas', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (opened) {
      fetchPlantillas();
    }
  }, [opened]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/contabilidad/${tenantId}/doc-libreria/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        notifications.show({ title: 'Eliminada', message: 'Plantilla eliminada correctamente', color: 'green' });
        fetchPlantillas();
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'No se pudo eliminar la plantilla', color: 'red' });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Librería de Plantillas / Borradores" size="xl" centered>
      {loading ? (
        <Center p="xl"><Loader color="violet" /></Center>
      ) : plantillas.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">No hay plantillas guardadas en la librería.</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre Plantilla</Table.Th>
              <Table.Th>Fecha de Creación</Table.Th>
              <Table.Th>Concepto</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {plantillas.map(p => (
              <Table.Tr key={p.id}>
                <Table.Td fw={500}>{p.nombrePlantilla}</Table.Td>
                <Table.Td>{dayjs(p.createdAt).format('DD/MM/YYYY HH:mm')}</Table.Td>
                <Table.Td>{p.concepto || '-'}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button 
                      size="xs" 
                      color="violet" 
                      variant="light" 
                      leftSection={<IconCheck size={14}/>}
                      onClick={() => onSelect(p)}
                    >
                      Cargar
                    </Button>
                    <ActionIcon color="red" variant="subtle" onClick={() => handleDelete(p.id)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Modal>
  );
}
