import React, { useState } from 'react';
import { Modal, Button, Table, ActionIcon, Group, TextInput, Text, Select } from '@mantine/core';
import { IconEdit, IconTrash, IconPlus, IconCheck, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface Props {
  opened: boolean;
  onClose: () => void;
  sucursales: any[];
  bancos: any[];
  tenantId: string;
  onSuccess: () => void;
}

export default function GestorSucursalesModal({ opened, onClose, sucursales, bancos, tenantId, onSuccess }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ bancoId: '', codigo: '', nombre: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const bancosData = bancos.map(b => ({ value: b.id.toString(), label: b.nombre }));

  const handleEdit = (sucursal: any) => {
    setIsAdding(false);
    setEditingId(sucursal.id);
    setFormData({ bancoId: sucursal.bancoId?.toString() || '', codigo: sucursal.codigo, nombre: sucursal.nombre });
  };

  const handleAdd = () => {
    setEditingId(null);
    setIsAdding(true);
    setFormData({ bancoId: '', codigo: '', nombre: '' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ bancoId: '', codigo: '', nombre: '' });
  };

  const handleSave = async () => {
    if (!formData.bancoId || !formData.codigo || !formData.nombre) {
      notifications.show({ title: 'Error', message: 'Banco, Código y nombre son requeridos', color: 'red' });
      return;
    }

    setLoading(true);
    try {
      const url = editingId 
        ? "http://localhost:3000/api/tesoreria/sucursales/" + editingId 
        : "http://localhost:3000/api/tesoreria/sucursales";
      
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
        notifications.show({ title: 'Éxito', message: 'Sucursal guardada', color: 'green' });
        onSuccess();
        handleCancel();
      } else {
        notifications.show({ title: 'Error', message: data.message || 'Error al guardar sucursal', color: 'red' });
      }
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Error', message: 'Error de red', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar esta sucursal de forma permanente?')) return;
    
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/tesoreria/sucursales/" + id, {
        method: 'DELETE',
        headers: { 'x-tenant-id': tenantId }
      });
      const data = await res.json();
      if (data.success) {
        notifications.show({ title: 'Éxito', message: 'Sucursal eliminada', color: 'green' });
        onSuccess();
      } else {
        notifications.show({ title: 'Error', message: data.message || 'Error al eliminar sucursal', color: 'red' });
      }
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Error', message: 'Error de red', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Gestión de Sucursales" size="lg">
      <Group justify="space-between" mb="md">
        <Text size="sm" c="dimmed">Administra las sucursales disponibles para tu empresa.</Text>
        <Button leftSection={<IconPlus size={16} />} onClick={handleAdd} size="xs" variant="light">
          Nueva Sucursal
        </Button>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={150}>Banco</Table.Th>
            <Table.Th w={100}>Código</Table.Th>
            <Table.Th>Nombre de la Sucursal</Table.Th>
            <Table.Th w={100} style={{ textAlign: 'center' }}>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isAdding && (
            <Table.Tr>
              <Table.Td>
                <Select
                  size="xs"
                  placeholder="Seleccione"
                  data={bancosData}
                  value={formData.bancoId}
                  onChange={(v) => setFormData({...formData, bancoId: v || ''})}
                />
              </Table.Td>
              <Table.Td>
                <TextInput 
                  size="xs" 
                  placeholder="Ej. S01" 
                  value={formData.codigo}
                  onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                />
              </Table.Td>
              <Table.Td>
                <TextInput 
                  size="xs" 
                  placeholder="Nombre de la Sucursal" 
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

          {sucursales.length === 0 && !isAdding && (
            <Table.Tr>
              <Table.Td colSpan={4} style={{ textAlign: 'center' }}>
                <Text size="sm" c="dimmed">No hay sucursales registradas</Text>
              </Table.Td>
            </Table.Tr>
          )}

          {sucursales.map((s) => (
            <Table.Tr key={s.id}>
              {editingId === s.id ? (
                <>
                  <Table.Td>
                    <Select
                      size="xs"
                      data={bancosData}
                      value={formData.bancoId}
                      onChange={(v) => setFormData({...formData, bancoId: v || ''})}
                    />
                  </Table.Td>
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
                  <Table.Td>{s.banco?.nombre || '-'}</Table.Td>
                  <Table.Td>{s.codigo}</Table.Td>
                  <Table.Td>{s.nombre}</Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="center">
                      <ActionIcon color="blue" variant="light" onClick={() => handleEdit(s)}>
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon color="red" variant="light" onClick={() => handleDelete(s.id)}>
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

