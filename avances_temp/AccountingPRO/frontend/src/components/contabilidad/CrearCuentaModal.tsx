import { useState, useEffect } from 'react';
import { Modal, TextInput, Radio, Group, Button, Stack, Text, LoadingOverlay, Box } from '@mantine/core';

interface Cuenta {
  codigo: string;
  nombre: string;
  movimiento: boolean;
  cuentaPadreId: string | null;
  nivel: number;
}

interface CrearCuentaModalProps {
  opened: boolean;
  onClose: () => void;
  tenantId: string;
  padre: Cuenta | null;
  todasLasCuentas: Cuenta[];
  onSuccess: () => void;
}

export default function CrearCuentaModal({ opened, onClose, tenantId, padre, todasLasCuentas, onSuccess }: CrearCuentaModalProps) {
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [movimiento, setMovimiento] = useState('No');
  const [loading, setLoading] = useState(false);
  const [nivelHijo, setNivelHijo] = useState<number>(0);

  useEffect(() => {
    if (opened && padre) {
      setNombre('');
      fetchEstructuraAndSuggest();
    }
  }, [opened, padre]);

  const fetchEstructuraAndSuggest = async () => {
    if (!padre) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/contabilidad/${tenantId}/estructura-puc`);
      const json = await res.json();
      if (json.success) {
        const config = json.data;
        // Determinar cuantos digitos tiene el siguiente nivel
        const currentLevel = padre.nivel;
        const nextLevel = currentLevel + 1;
        setNivelHijo(nextLevel);

        let digitsToAdd = 0;
        if (nextLevel === 1) digitsToAdd = config.nivel1Longitud;
        else if (nextLevel === 2) digitsToAdd = config.nivel2Longitud;
        else if (nextLevel === 3) digitsToAdd = config.nivel3Longitud;
        else if (nextLevel === 4) digitsToAdd = config.nivel4Longitud;
        else if (nextLevel === 5) digitsToAdd = config.nivel5Longitud;
        else digitsToAdd = 2; // default fallback

        // Buscar el maximo codigo de los hijos actuales
        const hijas = todasLasCuentas.filter(c => c.cuentaPadreId === padre.codigo);
        let suggested = '';

        if (hijas.length > 0) {
          const codigosNum = hijas.map(c => Number(c.codigo));
          const max = Math.max(...codigosNum);
          suggested = String(max + 1);
        } else {
          // No hay hijas, empezamos con 1 padding con ceros
          const suffix = '1'.padStart(digitsToAdd, '0');
          suggested = padre.codigo + suffix;
        }

        setCodigo(suggested);

        // Nivel 5 maximo
        const isLastLevel = nextLevel >= 5 || 
          (nextLevel === 4 && config.nivel5Longitud === 0) || 
          (nextLevel === 3 && config.nivel4Longitud === 0 && config.nivel5Longitud === 0);
        
        setMovimiento(isLastLevel ? 'Sí' : 'No');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!nombre.trim() || !codigo.trim() || !padre) return;

    setLoading(true);
    try {
      const payload = {
        codigo,
        nombre,
        cuentaPadreId: padre.codigo,
        movimiento: movimiento === 'Sí',
        nivel: nivelHijo
      };

      const res = await fetch(`http://localhost:3000/api/contabilidad/${tenantId}/plan-cuentas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
      alert('Error creando la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={700}>Crear Cuenta</Text>} centered>
      <Box style={{ position: 'relative' }}>
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        <Stack gap="md">
          <TextInput
            label="Código"
            placeholder="Ej. 110505"
            value={codigo}
            onChange={(e) => setCodigo(e.currentTarget.value)}
            required
            withAsterisk
          />
          <TextInput
            label="Nombre"
            placeholder="Ej. Caja General"
            value={nombre}
            onChange={(e) => setNombre(e.currentTarget.value)}
            required
            withAsterisk
            maxLength={300}
          />
          
          <Radio.Group
            label="Acepta Movimiento"
            value={movimiento}
            withAsterisk
          >
            <Group mt="xs">
              <Radio value="Sí" label="Sí" disabled />
              <Radio value="No" label="No" disabled />
            </Group>
          </Radio.Group>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>Cancelar</Button>
            <Button color="violet" onClick={handleSave}>Guardar</Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  );
}
