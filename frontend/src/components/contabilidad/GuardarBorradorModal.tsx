import React, { useState } from 'react';
import { Modal, Button, TextInput, Stack, Group } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';

interface GuardarBorradorModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (nombrePlantilla: string) => void;
  loading?: boolean;
}

export default function GuardarBorradorModal({ opened, onClose, onConfirm, loading }: GuardarBorradorModalProps) {
  const [nombre, setNombre] = useState('');

  const handleConfirm = () => {
    if (nombre.trim()) {
      onConfirm(nombre.trim());
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Guardar en Librería de Plantillas" centered>
      <Stack>
        <TextInput
          label="Nombre de la Plantilla"
          placeholder="Ej: Nómina Mensual, Pago Arriendo..."
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          autoFocus
        />
        <Group justify="flex-end" mt="md">
          <Button variant="outline" color="gray" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            color="violet" 
            onClick={handleConfirm} 
            disabled={!nombre.trim()} 
            loading={loading}
            leftSection={<IconDeviceFloppy size={16} />}
          >
            Guardar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
