import React, { useState } from 'react';
import { Modal, Button, Table, ActionIcon, Group, TextInput, Text } from '@mantine/core';
import { IconEdit, IconTrash, IconPlus, IconCheck, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface Props {
  opened: boolean;
  onClose: () => void;
  grupos: any[];
  tenantId: string;
  onSuccess: () => void;
}

export default function GestorGruposModal({ opened, onClose, grupos, tenantId, onSuccess }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ codigo: '', nombre: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEdit = (grupo: any) => {
    setIsAdding(false);
    setEditingId(grupo.id);
    setFormData({ codigo: grupo.codigo, nombre: grupo.nombre });
  };

  const handleAdd = () => {
    setEditingId(null);
    setIsAdding(true);
    setFormData({ codigo: '', nombre: '' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ codigo: '', nombre: '' });
  };

  const handleSave = async () => {
    if (!formData.codigo || !formData.nombre) {
      notifications.show({ title: 'Error', message: 'Código y nombre son requeridos', color: 'red' });
      return;
    }

    setLoading(true);
    try {
      const url = editingId 
        ? "http://localhost:3000/api/tesoreria/grupos-operaciones/" + editingId 
        : "http://localhost:3000/api/tesoreria/grupos-operaciones";
      
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
        notifications.show({ title: 'Éxito', message: 'Grupo de operaciones guardado', color: 'green' });
        onSuccess();
        handleCancel();
      } else {
        notifications.show({ title: 'Error', message: data.message || 'Error al guardar grupo', color: 'red' });
      }
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Error', message: 'Error de red', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este grupo de forma permanente?')) return;
    
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/tesoreria/grupos-operaciones/" + id, {
        method: 'DELETE',
        headers: { 'x-tenant-id': tenantId }
      });
      const data = await res.json();
      if (data.success) {
        notifications.show({ title: 'Éxito', message: 'Grupo eliminado', color: 'green' });
        onSuccess();
      } else {
        notifications.show({ title: 'Error', message: data.message || 'Error al eliminar grupo', color: 'red' });
      }
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Error', message: 'Error de red', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Gestión de Grupos de Operaciones" size="lg">
      <Group justify="space-between" mb="md">
        <Text size="sm" c="dimmed">Administra las categorías y grupos de operaciones de tesorería.</Text>
        <Button leftSection={<IconPlus size={16} />} onClick={handleAdd} size="xs" variant="light">
          Nuevo Grupo
        </Button>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={100}>Código</Table.Th>
            <Table.Th>Nombre del Grupo</Table.Th>
            <Table.Th w={100} style={{ textAlign: 'center' }}>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isAdding && (
            <Table.Tr>
              <Table.Td>
                <TextInput 
                  size="xs" 
                  placeholder="Ej. G01" 
                  value={formData.codigo}
                  onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                />
              </Table.Td>
              <Table.Td>
                <TextInput 
                  size="xs" 
                  placeholder="Nombre del Grupo" 
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                />
              </Table.Td>
              <Table.Td>
                <Group gap={4} justify="center">
                  <ActionIcon color="green" variant="light" onClick={handleSave} loading={loading}>
                    <IconCheck size={16} />
                  </ActionIcon>
                  <ActionIcon color="red" variant="light" onClick={handleCancel} disabled={loading}>
                    <IconX size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          )}

          {grupos.length === 0 && !isAdding && (
            <Table.Tr>
              <Table.Td colSpan={3} style={{ textAlign: 'center' }}>
                <Text size="sm" c="dimmed">No hay grupos registrados</Text>
              </Table.Td>
            </Table.Tr>
          )}

          {grupos.map((g) => (
            <Table.Tr key={g.id}>
              {editingId === g.id ? (
                <>
                  <Table.Td>
                    <TextInput 
                      size="xs" 
                      value={formData.codigo}
                      onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput 
                      size="xs" 
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="center">
                      <ActionIcon color="green" variant="light" onClick={handleSave} loading={loading}>
                        <IconCheck size={16} />
                      </ActionIcon>
                      <ActionIcon color="gray" variant="light" onClick={handleCancel} disabled={loading}>
                        <IconX size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </>
              ) : (
                <>
                  <Table.Td>{g.codigo}</Table.Td>
                  <Table.Td>{g.nombre}</Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="center">
                      <ActionIcon color="blue" variant="light" onClick={() => handleEdit(g)}>
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon color="red" variant="light" onClick={() => handleDelete(g.id)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </>
              )}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Modal>
  );
}

